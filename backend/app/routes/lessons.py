from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.course import LessonDetailOut, LessonListOut
from app.schemas.progress import LessonSubmitIn, LessonSubmitOut
from app.services.context_service import get_current_user_id
from app.services.course_service import (
    build_lesson_quality_bundle,
    build_transcript_segments,
    build_video_sections,
    get_lesson_or_404,
    list_lessons,
    parse_lesson_content,
    parse_quiz_options,
)
from app.services.progress_service import submit_lesson_result
from app.services.subscription_service import ensure_premium_access

router = APIRouter(prefix='/lessons', tags=['lessons'])


@router.get('', response_model=list[LessonListOut])
def get_lessons(
    module_id: int | None = Query(default=None),
    _: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[LessonListOut]:
    return [LessonListOut.model_validate(item) for item in list_lessons(db=db, module_id=module_id)]


@router.get('/{lesson_id}', response_model=LessonDetailOut)
def get_lesson(
    lesson_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> LessonDetailOut:
    lesson = get_lesson_or_404(db=db, lesson_id=lesson_id)
    is_premium_course = bool(lesson.module and lesson.module.course and lesson.module.course.is_premium)
    ensure_premium_access(db=db, user_id=user_id, is_premium=is_premium_course)
    content_blocks = parse_lesson_content(lesson)
    quality = build_lesson_quality_bundle(lesson)
    return LessonDetailOut(
        id=lesson.id,
        title=lesson.title,
        topic=lesson.module.title if lesson.module else 'General',
        content=content_blocks,
        lesson_goal=quality['lesson_goal'],
        key_concepts=quality['key_concepts'],
        quiz_question=lesson.quiz_question,
        quiz_options=parse_quiz_options(lesson),
        video_url=lesson.video_url,
        video_duration_seconds=lesson.video_duration_seconds,
        video_sections=build_video_sections(lesson=lesson, content_blocks=content_blocks),
        transcript_segments=build_transcript_segments(lesson=lesson, content_blocks=content_blocks),
    )


@router.post('/{lesson_id}/submit', response_model=LessonSubmitOut)
def submit_lesson(
    lesson_id: int,
    payload: LessonSubmitIn,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> LessonSubmitOut:
    lesson = get_lesson_or_404(db=db, lesson_id=lesson_id)
    is_premium_course = bool(lesson.module and lesson.module.course and lesson.module.course.is_premium)
    ensure_premium_access(db=db, user_id=user_id, is_premium=is_premium_course)
    result = submit_lesson_result(db=db, user_id=user_id, lesson=lesson, payload=payload)
    return LessonSubmitOut.model_validate(result)
