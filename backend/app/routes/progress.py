from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.progress import (
    LessonSubmitIn,
    LessonSubmitOut,
    ProgressCompleteOut,
    ProgressOut,
    ResumeLessonOut,
    TranscriptNoteOut,
    TranscriptNotesUpsertIn,
    VideoProgressIn,
    VideoProgressOut,
)
from app.services.context_service import get_current_user_id
from app.services.course_service import get_lesson_or_404
from app.services.progress_service import (
    get_video_progress,
    get_resume_lessons,
    list_progress,
    list_transcript_notes,
    mark_lesson_complete,
    submit_lesson_result,
    upsert_transcript_notes,
    upsert_video_progress,
)

router = APIRouter(prefix='/progress', tags=['progress'])


@router.get('', response_model=list[ProgressOut])
def get_progress(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[ProgressOut]:
    return [ProgressOut.model_validate(item) for item in list_progress(db=db, user_id=user_id)]


@router.post('/lessons/{lesson_id}/submit', response_model=LessonSubmitOut)
def submit_progress_lesson(
    lesson_id: int,
    payload: LessonSubmitIn,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> LessonSubmitOut:
    lesson = get_lesson_or_404(db=db, lesson_id=lesson_id)
    result = submit_lesson_result(db=db, user_id=user_id, lesson=lesson, payload=payload)
    return LessonSubmitOut.model_validate(result)


@router.post('/lessons/{lesson_id}/complete', response_model=ProgressCompleteOut)
def complete_progress_lesson(
    lesson_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> ProgressCompleteOut:
    get_lesson_or_404(db=db, lesson_id=lesson_id)
    result = mark_lesson_complete(db=db, user_id=user_id, lesson_id=lesson_id)
    return ProgressCompleteOut.model_validate(result)


@router.get('/lessons/{lesson_id}/video', response_model=VideoProgressOut)
def get_lesson_video_progress(
    lesson_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> VideoProgressOut:
    get_lesson_or_404(db=db, lesson_id=lesson_id)
    result = get_video_progress(db=db, user_id=user_id, lesson_id=lesson_id)
    return VideoProgressOut.model_validate(result)


@router.put('/lessons/{lesson_id}/video', response_model=VideoProgressOut)
def save_lesson_video_progress(
    lesson_id: int,
    payload: VideoProgressIn,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> VideoProgressOut:
    get_lesson_or_404(db=db, lesson_id=lesson_id)
    result = upsert_video_progress(db=db, user_id=user_id, lesson_id=lesson_id, payload=payload)
    return VideoProgressOut.model_validate(result)


@router.get('/resume', response_model=list[ResumeLessonOut])
def get_resume_items(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[ResumeLessonOut]:
    result = get_resume_lessons(db=db, user_id=user_id)
    return [ResumeLessonOut.model_validate(item) for item in result]


@router.get('/lessons/{lesson_id}/transcript-notes', response_model=list[TranscriptNoteOut])
def get_lesson_transcript_notes(
    lesson_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[TranscriptNoteOut]:
    get_lesson_or_404(db=db, lesson_id=lesson_id)
    result = list_transcript_notes(db=db, user_id=user_id, lesson_id=lesson_id)
    return [TranscriptNoteOut.model_validate(item) for item in result]


@router.put('/lessons/{lesson_id}/transcript-notes', response_model=list[TranscriptNoteOut])
def save_lesson_transcript_notes(
    lesson_id: int,
    payload: TranscriptNotesUpsertIn,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[TranscriptNoteOut]:
    get_lesson_or_404(db=db, lesson_id=lesson_id)
    result = upsert_transcript_notes(db=db, user_id=user_id, lesson_id=lesson_id, payload=payload)
    return [TranscriptNoteOut.model_validate(item) for item in result]
