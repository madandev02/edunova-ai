from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.progress import Progress
from app.models.learning_session import LearningSession
from app.core.database import get_db
from app.schemas.course import CourseDetailOut, CourseOut, LessonNestedOut, ModuleNestedOut
from app.services.context_service import get_current_user_id
from app.services.course_service import build_course_quality_bundle, get_course_or_404, list_courses
from app.services.subscription_service import ensure_premium_access, get_or_create_subscription, user_has_paid_access

router = APIRouter(prefix='/courses', tags=['courses'])


@router.get('', response_model=list[CourseOut])
def get_courses(
    category: str | None = Query(default=None),
    difficulty: str | None = Query(default=None),
    search: str | None = Query(default=None),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[CourseOut]:
    courses = list_courses(db=db, category=category, difficulty=difficulty, search=search)
    subscription = get_or_create_subscription(db=db, user_id=user_id)
    has_paid_access = user_has_paid_access(subscription)
    output: list[CourseOut] = []

    sessions = db.scalars(
        select(LearningSession)
        .where(
            LearningSession.user_id == user_id,
            LearningSession.lesson_id.is_not(None),
            LearningSession.playback_seconds > 0,
        )
        .order_by(LearningSession.updated_at.desc())
    ).all()

    latest_session_by_lesson: dict[int, LearningSession] = {}
    for session in sessions:
        lesson = session.lesson
        if lesson is None:
            continue

        duration = lesson.video_duration_seconds or 0
        playback_ratio = (session.playback_seconds / duration) if duration > 0 else 0.0
        is_resume_candidate = (session.completion_ratio < 0.98) or (playback_ratio < 0.95)
        if not is_resume_candidate:
            continue

        if session.lesson_id is None or session.lesson_id in latest_session_by_lesson:
            continue
        latest_session_by_lesson[session.lesson_id] = session

    for course in courses:
        quality = build_course_quality_bundle(course)
        modules_count = len(course.modules)
        lessons_count = sum(len(module.lessons) for module in course.modules)
        estimated_time_hours = max(1, round(lessons_count * 0.6))
        lesson_ids = {lesson.id for module in course.modules for lesson in module.lessons}

        resume_session = next(
            (latest_session_by_lesson[item] for item in lesson_ids if item in latest_session_by_lesson),
            None,
        )

        resume_lesson = resume_session.lesson if resume_session else None

        output.append(
            CourseOut(
                id=course.id,
                title=course.title,
                description=course.description,
                category=course.category,
                difficulty=course.difficulty,
                is_premium=course.is_premium,
                is_locked=course.is_premium and not has_paid_access,
                estimated_time_hours=estimated_time_hours,
                lessons_count=lessons_count,
                modules_count=modules_count,
                learning_objectives=quality['learning_objectives'],
                prerequisites=quality['prerequisites'],
                resume_lesson_id=resume_lesson.id if resume_lesson else None,
                resume_lesson_title=resume_lesson.title if resume_lesson else None,
                resume_playback_seconds=resume_session.playback_seconds if resume_session else None,
                resume_completion_ratio=round(resume_session.completion_ratio, 3) if resume_session else None,
            )
        )

    return output


@router.get('/{course_id}', response_model=CourseDetailOut)
def get_course_detail(
    course_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> CourseDetailOut:
    course = get_course_or_404(db=db, course_id=course_id)
    ensure_premium_access(db=db, user_id=user_id, is_premium=course.is_premium)

    modules = []
    for module in sorted(course.modules, key=lambda item: item.id):
        lessons = [
            LessonNestedOut.model_validate(lesson)
            for lesson in sorted(module.lessons, key=lambda item: item.order_index)
        ]
        modules.append(ModuleNestedOut(id=module.id, title=module.title, lessons=lessons))

    lesson_ids = [lesson.id for module in course.modules for lesson in module.lessons]
    quality = build_course_quality_bundle(course)
    lessons_count = len(lesson_ids)
    modules_count = len(course.modules)
    completed_count = 0
    if lesson_ids:
        completed_count = len(
            db.scalars(
                select(Progress).where(
                    Progress.user_id == user_id,
                    Progress.lesson_id.in_(lesson_ids),
                    Progress.completed.is_(True),
                )
            ).all()
        )
    progress_percentage = round((completed_count / lessons_count) * 100, 2) if lessons_count else 0.0

    return CourseDetailOut(
        id=course.id,
        title=course.title,
        description=course.description,
        category=course.category,
        difficulty=course.difficulty,
        is_premium=course.is_premium,
        is_locked=False,
        estimated_time_hours=max(1, round(lessons_count * 0.6)),
        lessons_count=lessons_count,
        modules_count=modules_count,
        progress_percentage=progress_percentage,
        learning_objectives=quality['learning_objectives'],
        prerequisites=quality['prerequisites'],
        modules=modules,
    )
