from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.course import (
    InstructorCourseCreateIn,
    InstructorCourseOut,
    InstructorCourseUpdateIn,
    InstructorModuleCreateIn,
    InstructorModuleOut,
    InstructorModuleUpdateIn,
    InstructorLessonCreateIn,
    InstructorLessonOut,
    InstructorLessonUpdateIn,
)
from app.services.context_service import get_current_instructor_user_id
from app.services.instructor_service import (
    get_instructor_courses,
    get_course_by_instructor,
    create_instructor_course,
    update_instructor_course,
    delete_instructor_course,
    create_module,
    update_module,
    delete_module,
    create_lesson,
    update_lesson,
    delete_lesson,
)
router = APIRouter(prefix='/instructor', tags=['instructor'])


@router.get('/courses', response_model=list[InstructorCourseOut])
def list_instructor_courses(
    instructor_id: int = Depends(get_current_instructor_user_id),
    db: Session = Depends(get_db),
) -> list[InstructorCourseOut]:
    """List all courses authored by current instructor."""
    courses = get_instructor_courses(db, instructor_id)
    return [InstructorCourseOut.model_validate(c) for c in courses]


@router.post('/courses', response_model=InstructorCourseOut)
def create_course(
    payload: InstructorCourseCreateIn,
    instructor_id: int = Depends(get_current_instructor_user_id),
    db: Session = Depends(get_db),
) -> InstructorCourseOut:
    """Create a new course as instructor."""
    course = create_instructor_course(
        db=db,
        instructor_id=instructor_id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        difficulty=payload.difficulty,
        is_premium=payload.is_premium,
        thumbnail_url=payload.thumbnail_url,
    )
    return InstructorCourseOut.model_validate(course)


@router.get('/courses/{course_id}', response_model=InstructorCourseOut)
def get_course(
    course_id: int,
    instructor_id: int = Depends(get_current_instructor_user_id),
    db: Session = Depends(get_db),
) -> InstructorCourseOut:
    """Get course details."""
    course = get_course_by_instructor(db, course_id, instructor_id)
    return InstructorCourseOut.model_validate(course)


@router.put('/courses/{course_id}', response_model=InstructorCourseOut)
def update_course(
    course_id: int,
    payload: InstructorCourseUpdateIn,
    instructor_id: int = Depends(get_current_instructor_user_id),
    db: Session = Depends(get_db),
) -> InstructorCourseOut:
    """Update course details."""
    course = update_instructor_course(
        db=db,
        course_id=course_id,
        instructor_id=instructor_id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        difficulty=payload.difficulty,
        is_premium=payload.is_premium,
        thumbnail_url=payload.thumbnail_url,
    )
    return InstructorCourseOut.model_validate(course)


@router.delete('/courses/{course_id}')
def delete_course(
    course_id: int,
    instructor_id: int = Depends(get_current_instructor_user_id),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Delete course."""
    delete_instructor_course(db, course_id, instructor_id)
    return {'status': 'deleted'}


@router.post('/courses/{course_id}/modules', response_model=InstructorModuleOut)
def create_course_module(
    course_id: int,
    payload: InstructorModuleCreateIn,
    instructor_id: int = Depends(get_current_instructor_user_id),
    db: Session = Depends(get_db),
) -> InstructorModuleOut:
    """Create module in course."""
    module = create_module(db, course_id, instructor_id, payload.title)
    return InstructorModuleOut.model_validate(module)


@router.put('/modules/{module_id}', response_model=InstructorModuleOut)
def update_course_module(
    module_id: int,
    payload: InstructorModuleUpdateIn,
    instructor_id: int = Depends(get_current_instructor_user_id),
    db: Session = Depends(get_db),
) -> InstructorModuleOut:
    """Update module."""
    module = update_module(db, module_id, instructor_id, title=payload.title)
    return InstructorModuleOut.model_validate(module)


@router.delete('/modules/{module_id}')
def delete_course_module(
    module_id: int,
    instructor_id: int = Depends(get_current_instructor_user_id),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Delete module."""
    delete_module(db, module_id, instructor_id)
    return {'status': 'deleted'}


@router.post('/modules/{module_id}/lessons', response_model=InstructorLessonOut)
def create_module_lesson(
    module_id: int,
    payload: InstructorLessonCreateIn,
    instructor_id: int = Depends(get_current_instructor_user_id),
    db: Session = Depends(get_db),
) -> InstructorLessonOut:
    """Create lesson in module."""
    lesson = create_lesson(
        db=db,
        module_id=module_id,
        instructor_id=instructor_id,
        title=payload.title,
        content=payload.content,
        difficulty=payload.difficulty,
        order_index=payload.order_index,
        quiz_question=payload.quiz_question,
        quiz_options=payload.quiz_options,
        correct_answer=payload.correct_answer,
        video_url=payload.video_url,
        video_duration_seconds=payload.video_duration_seconds,
    )
    return InstructorLessonOut.model_validate(lesson)


@router.put('/lessons/{lesson_id}', response_model=InstructorLessonOut)
def update_module_lesson(
    lesson_id: int,
    payload: InstructorLessonUpdateIn,
    instructor_id: int = Depends(get_current_instructor_user_id),
    db: Session = Depends(get_db),
) -> InstructorLessonOut:
    """Update lesson."""
    lesson = update_lesson(
        db=db,
        lesson_id=lesson_id,
        instructor_id=instructor_id,
        title=payload.title,
        content=payload.content,
        difficulty=payload.difficulty,
        order_index=payload.order_index,
        quiz_question=payload.quiz_question,
        quiz_options=payload.quiz_options,
        correct_answer=payload.correct_answer,
        video_url=payload.video_url,
        video_duration_seconds=payload.video_duration_seconds,
    )
    return InstructorLessonOut.model_validate(lesson)


@router.delete('/lessons/{lesson_id}')
def delete_module_lesson(
    lesson_id: int,
    instructor_id: int = Depends(get_current_instructor_user_id),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Delete lesson."""
    delete_lesson(db, lesson_id, instructor_id)
    return {'status': 'deleted'}
