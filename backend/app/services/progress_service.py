import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.attempt_event import AttemptEvent
from app.models.course import Lesson
from app.models.learning_session import LearningSession
from app.models.progress import Progress
from app.models.transcript_note import TranscriptNote
from app.services.gamification_service import apply_learning_event
from app.schemas.progress import LessonSubmitIn, TranscriptNotesUpsertIn, VideoProgressIn
from app.services.recommendation_service import get_recommendations_for_user, refresh_recommendations
from app.services.skill_service import update_skills_from_attempt


def _normalize(value: str) -> str:
    return value.strip().lower()


def _score_answer(lesson: Lesson, answer: str) -> float:
    if lesson.correct_answer and _normalize(answer) == _normalize(lesson.correct_answer):
        return 100.0
    if len(answer.strip()) > 120:
        return 75.0
    if len(answer.strip()) > 40:
        return 60.0
    return 40.0


def submit_lesson_result(db: Session, user_id: int, lesson: Lesson, payload: LessonSubmitIn) -> dict:
    progress = db.scalar(
        select(Progress).where(Progress.user_id == user_id, Progress.lesson_id == lesson.id)
    )

    if progress is None:
        progress = Progress(user_id=user_id, lesson_id=lesson.id, score=0.0, attempts=0, completed=False)
        db.add(progress)

    new_score = _score_answer(lesson=lesson, answer=payload.answer)
    progress.attempts += 1
    progress.score = round(((progress.score * (progress.attempts - 1)) + new_score) / progress.attempts, 2)
    progress.completed = progress.score >= 80

    db.add(
        AttemptEvent(
            user_id=user_id,
            lesson_id=lesson.id,
            score=new_score,
            attempts_at_time=progress.attempts,
            time_spent_seconds=payload.time_spent_seconds,
        )
    )

    update_skills_from_attempt(
        db=db,
        user_id=user_id,
        lesson=lesson,
        score=new_score,
        attempts=progress.attempts,
        time_spent_seconds=payload.time_spent_seconds,
    )

    gamification = apply_learning_event(
        db=db,
        user_id=user_id,
        score=new_score,
        completed=progress.completed,
    )

    db.commit()
    db.refresh(progress)

    refresh_recommendations(db=db, user_id=user_id)
    recommendations = get_recommendations_for_user(db=db, user_id=user_id)

    feedback = (
        'Strong result. You demonstrated mastery on this attempt and are ready for the next challenge.'
        if new_score >= 80
        else 'You are close, but key concepts are still shaky. Rewatch the highlighted sections and retry with a shorter, clearer answer.'
    )

    return {
        'score': progress.score,
        'feedback': feedback,
        'recommendationImpact': recommendations[0]['reason'] if recommendations else None,
        'xpGained': 8 + int(new_score / 10) + (20 if progress.completed else 0),
        'streakDays': gamification.streak_days,
    }


def list_progress(db: Session, user_id: int) -> list[Progress]:
    return db.scalars(select(Progress).where(Progress.user_id == user_id)).all()


def mark_lesson_complete(db: Session, user_id: int, lesson_id: int) -> dict:
    progress = db.scalar(
        select(Progress).where(Progress.user_id == user_id, Progress.lesson_id == lesson_id)
    )

    if progress is None:
        progress = Progress(user_id=user_id, lesson_id=lesson_id, score=80.0, attempts=1, completed=True)
        db.add(progress)
    else:
        progress.completed = True
        if progress.attempts == 0:
            progress.attempts = 1

    apply_learning_event(db=db, user_id=user_id, score=progress.score or 80.0, completed=True)

    db.commit()
    refresh_recommendations(db=db, user_id=user_id)

    return {
        'lesson_id': lesson_id,
        'completed': True,
    }


def _get_or_create_video_session(db: Session, user_id: int, lesson_id: int) -> LearningSession:
    session = db.scalar(
        select(LearningSession).where(
            LearningSession.user_id == user_id,
            LearningSession.lesson_id == lesson_id,
        )
    )
    if session is None:
        session = LearningSession(user_id=user_id, lesson_id=lesson_id)
        db.add(session)
        db.flush()
    return session


def get_video_progress(db: Session, user_id: int, lesson_id: int) -> dict:
    session = db.scalar(
        select(LearningSession).where(
            LearningSession.user_id == user_id,
            LearningSession.lesson_id == lesson_id,
        )
    )
    if session is None:
        return {
            'lesson_id': lesson_id,
            'playback_seconds': 0,
            'completed_section_ids': [],
            'completion_ratio': 0.0,
        }

    try:
        section_ids = json.loads(session.watched_sections_json)
    except json.JSONDecodeError:
        section_ids = []

    if not isinstance(section_ids, list):
        section_ids = []

    return {
        'lesson_id': lesson_id,
        'playback_seconds': max(0, int(session.playback_seconds)),
        'completed_section_ids': [str(item) for item in section_ids],
        'completion_ratio': round(max(0.0, min(1.0, float(session.completion_ratio))), 3),
    }


def upsert_video_progress(db: Session, user_id: int, lesson_id: int, payload: VideoProgressIn) -> dict:
    lesson = db.scalar(select(Lesson).where(Lesson.id == lesson_id))
    if lesson is None:
        raise ValueError('Lesson not found')

    session = _get_or_create_video_session(db=db, user_id=user_id, lesson_id=lesson_id)

    unique_sections = sorted({item.strip() for item in payload.completed_section_ids if item.strip()})
    total_sections = max(1, len([chunk for chunk in lesson.content.split('\n\n') if chunk.strip()]))
    section_ratio = min(1.0, len(unique_sections) / total_sections)

    duration = payload.video_duration_seconds or lesson.video_duration_seconds or 1
    playback_ratio = min(1.0, payload.playback_seconds / max(1, duration))

    session.playback_seconds = max(0, payload.playback_seconds)
    session.watched_sections_json = json.dumps(unique_sections)
    session.completion_ratio = round(max(section_ratio, playback_ratio), 3)

    db.commit()

    refresh_recommendations(db=db, user_id=user_id)

    return {
        'lesson_id': lesson_id,
        'playback_seconds': session.playback_seconds,
        'completed_section_ids': unique_sections,
        'completion_ratio': session.completion_ratio,
    }


def list_transcript_notes(db: Session, user_id: int, lesson_id: int) -> list[dict]:
    notes = db.scalars(
        select(TranscriptNote)
        .where(
            TranscriptNote.user_id == user_id,
            TranscriptNote.lesson_id == lesson_id,
        )
        .order_by(TranscriptNote.updated_at.desc())
    ).all()

    return [
        {
            'id': item.id,
            'lesson_id': item.lesson_id,
            'segment_id': item.segment_id,
            'highlight_text': item.highlight_text,
            'note_text': item.note_text,
        }
        for item in notes
    ]


def upsert_transcript_notes(
    db: Session,
    user_id: int,
    lesson_id: int,
    payload: TranscriptNotesUpsertIn,
) -> list[dict]:
    existing_notes = db.scalars(
        select(TranscriptNote).where(
            TranscriptNote.user_id == user_id,
            TranscriptNote.lesson_id == lesson_id,
        )
    ).all()
    existing_by_segment = {item.segment_id: item for item in existing_notes}

    for note in payload.notes:
        segment_id = note.segment_id.strip()
        if not segment_id:
            continue

        highlight_text = note.highlight_text.strip() if note.highlight_text else None
        note_text = note.note_text.strip() if note.note_text else None

        existing = existing_by_segment.get(segment_id)
        if highlight_text is None and note_text is None:
            if existing is not None:
                db.delete(existing)
            continue

        if existing is None:
            db.add(
                TranscriptNote(
                    user_id=user_id,
                    lesson_id=lesson_id,
                    segment_id=segment_id,
                    highlight_text=highlight_text,
                    note_text=note_text,
                )
            )
            continue

        existing.highlight_text = highlight_text
        existing.note_text = note_text

    db.commit()
    return list_transcript_notes(db=db, user_id=user_id, lesson_id=lesson_id)


def get_resume_lessons(db: Session, user_id: int, limit: int = 5) -> list[dict]:
    rows = db.scalars(
        select(LearningSession)
        .where(
            LearningSession.user_id == user_id,
            LearningSession.lesson_id.is_not(None),
            LearningSession.playback_seconds > 0,
        )
        .order_by(LearningSession.updated_at.desc())
    ).all()

    output: list[dict] = []
    for row in rows:
        lesson = row.lesson
        if lesson is None:
            continue

        duration = lesson.video_duration_seconds or 0
        playback_ratio = (row.playback_seconds / duration) if duration > 0 else 0.0
        is_resume_candidate = (row.completion_ratio < 0.98) or (playback_ratio < 0.95)
        if not is_resume_candidate:
            continue

        module = lesson.module
        course = module.course if module else None
        output.append(
            {
                'lesson_id': lesson.id,
                'lesson_title': lesson.title,
                'course_id': course.id if course else None,
                'course_title': course.title if course else None,
                'playback_seconds': row.playback_seconds,
                'completion_ratio': round(row.completion_ratio or 0.0, 3),
                'last_watched_at': row.updated_at.isoformat() if row.updated_at else None,
            }
        )

        if len(output) >= limit:
            break

    return output
