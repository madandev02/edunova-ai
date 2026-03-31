from collections import defaultdict
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.course import Lesson, Module
from app.models.learning_session import LearningSession
from app.models.progress import Progress
from app.models.skill_profile import SkillProfile

PRIORITY_RANK = {'HIGH': 3, 'MEDIUM': 2, 'LOW': 1}


def _find_previous_lesson(db: Session, lesson: Lesson) -> Lesson | None:
    return db.scalar(
        select(Lesson)
        .where(
            Lesson.module_id == lesson.module_id,
            Lesson.order_index < lesson.order_index,
        )
        .order_by(Lesson.order_index.desc())
    )


def _find_next_lesson(db: Session, lesson: Lesson) -> Lesson | None:
    return db.scalar(
        select(Lesson)
        .where(
            Lesson.module_id == lesson.module_id,
            Lesson.order_index > lesson.order_index,
        )
        .order_by(Lesson.order_index.asc())
    )


def build_recommendations(db: Session, user_id: int) -> list[dict]:
    progress_rows = db.scalars(
        select(Progress)
        .where(Progress.user_id == user_id)
        .options(selectinload(Progress.lesson).selectinload(Lesson.module))
    ).all()

    video_rows = db.scalars(
        select(LearningSession)
        .where(
            LearningSession.user_id == user_id,
            LearningSession.lesson_id.is_not(None),
        )
    ).all()

    candidates: dict[int, dict] = {}
    lesson_ids = {row.lesson_id for row in progress_rows if row.lesson_id is not None}
    lesson_ids.update({row.lesson_id for row in video_rows if row.lesson_id is not None})
    lessons_by_id = {
        item.id: item
        for item in db.scalars(select(Lesson).where(Lesson.id.in_(lesson_ids))).all()
    } if lesson_ids else {}

    def upsert(lesson_id: int, priority: str, reason: str, decay_rule: str = 'none') -> None:
        existing = candidates.get(lesson_id)
        if existing is None or PRIORITY_RANK[priority] > PRIORITY_RANK[existing['priority']]:
            candidates[lesson_id] = {
                'lesson_id': lesson_id,
                'priority': priority,
                'decay_rule': decay_rule,
                'reason': reason,
            }

    for progress in progress_rows:
        lesson = progress.lesson
        if lesson is None:
            continue

        if progress.score < 50:
            upsert(
                lesson.id,
                'HIGH',
                f'You are struggling with {lesson.title}. Reviewing this lesson now will strengthen your foundation before moving forward.',
            )

        if progress.attempts >= 3 and progress.score < 60:
            prerequisite = _find_previous_lesson(db, lesson)
            if prerequisite is not None:
                upsert(
                    prerequisite.id,
                    'HIGH',
                    f'You have made several attempts on {lesson.title}. Revisit the prerequisite first to close the gap and improve your next try.',
                )

        if progress.score > 80:
            next_lesson = _find_next_lesson(db, lesson)
            if next_lesson is not None:
                upsert(
                    next_lesson.id,
                    'LOW',
                    f'Great work on {lesson.title}. You are ready to continue with this next lesson while the context is fresh.',
                )

    module_scores: dict[int, list[float]] = defaultdict(list)
    for progress in progress_rows:
        if progress.lesson and progress.lesson.module_id:
            module_scores[progress.lesson.module_id].append(progress.score)

    for module_id, scores in module_scores.items():
        average = sum(scores) / len(scores)
        if average < 60:
            module = db.scalar(
                select(Module).where(Module.id == module_id).options(selectinload(Module.lessons))
            )
            if module is None or not module.lessons:
                continue

            target_lesson = sorted(module.lessons, key=lambda item: item.order_index)[0]
            upsert(
                target_lesson.id,
                'MEDIUM',
                f'Your recent results in {module.title} are trending low ({average:.1f}%). This lesson is the best reset point.',
            )

    skill_rows = db.scalars(select(SkillProfile).where(SkillProfile.user_id == user_id)).all()
    for skill in skill_rows:
        if skill.score >= 0.6:
            continue

        module = db.scalar(
            select(Module)
            .where(Module.title.ilike(f'%{skill.topic}%'))
            .options(selectinload(Module.lessons))
        )
        if module and module.lessons:
            weakest_lesson = sorted(module.lessons, key=lambda item: item.order_index)[0]
            upsert(
                weakest_lesson.id,
                'HIGH',
                f'Your skill confidence in {skill.topic} is still low ({skill.score:.2f}). Reviewing this lesson will make upcoming content easier.',
            )

    unfinished = [
        row
        for row in progress_rows
        if row.attempts > 0 and not row.completed
    ]
    for row in unfinished:
        if row.lesson:
            upsert(
                row.lesson.id,
                'HIGH',
                f'You already started {row.lesson.title}. Finishing it now will lock in progress and unlock better recommendations.',
            )

    for video_row in video_rows:
        lesson_id = video_row.lesson_id
        if lesson_id is None:
            continue

        completion_ratio = video_row.completion_ratio or 0.0
        if completion_ratio >= 0.55:
            continue

        lesson = lessons_by_id.get(lesson_id)
        if lesson is None:
            continue

        progress = next((row for row in progress_rows if row.lesson_id == lesson_id), None)
        lesson_topic = lesson.module.title.lower() if lesson.module else lesson.title.lower()
        skill = next((item for item in skill_rows if item.topic in lesson_topic), None)

        age_hours = 0.0
        if video_row.updated_at is not None:
            age_hours = max(0.0, (datetime.utcnow() - video_row.updated_at).total_seconds() / 3600)

        relevant = (progress is not None and progress.score < 70) or (skill is not None and skill.score < 0.65)

        if age_hours > 120 and not relevant:
            continue

        if age_hours <= 24:
            priority = 'MEDIUM'
            decay_rule = 'recent_pause'
        elif age_hours <= 72:
            priority = 'LOW'
            decay_rule = 'warm_stale'
        else:
            priority = 'LOW' if relevant else 'MEDIUM'
            decay_rule = 'cold_relevant'

        freshness_hint = (
            'recently paused' if age_hours <= 24 else 'stale and still relevant'
        )
        upsert(
            lesson_id,
            priority,
            f'You completed {int(completion_ratio * 100)}% of {lesson.title}. It is {freshness_hint}, so resuming now can convert partial progress into mastery.',
            decay_rule=decay_rule,
        )

    if not candidates:
        all_lessons = db.scalars(select(Lesson).order_by(Lesson.module_id.asc(), Lesson.order_index.asc())).all()
        progress_by_lesson = {row.lesson_id: row for row in progress_rows}
        next_incomplete = next(
            (
                lesson
                for lesson in all_lessons
                if lesson.id not in progress_by_lesson or not progress_by_lesson[lesson.id].completed
            ),
            None,
        )
        if next_incomplete is not None:
            upsert(
                next_incomplete.id,
                'MEDIUM',
                'Start your next incomplete lesson so the system can personalize recommendations from real performance data.',
            )

    if len(candidates) < 3:
        all_lessons = db.scalars(select(Lesson).order_by(Lesson.module_id.asc(), Lesson.order_index.asc())).all()
        for lesson in all_lessons:
            if lesson.id in candidates:
                continue
            upsert(
                lesson.id,
                'LOW',
                f'New suggestion: {lesson.title} is a good momentum step while you build consistency.',
            )
            if len(candidates) >= 3:
                break

    return sorted(candidates.values(), key=lambda item: PRIORITY_RANK[item['priority']], reverse=True)
