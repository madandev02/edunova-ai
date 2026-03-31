from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.course import Course, Module, Lesson
from app.models.user import User


def get_instructor_courses(db: Session, instructor_id: int) -> list[Course]:
    """Get all courses authored by instructor."""
    return db.scalars(
        select(Course).where(Course.instructor_id == instructor_id)
    ).all()


def get_course_by_instructor(db: Session, course_id: int, instructor_id: int) -> Course:
    """Get course ensuring current user is the instructor."""
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=404, detail='Course not found')

    if course.instructor_id != instructor_id:
        raise HTTPException(status_code=403, detail='Not your course to edit')

    return course


def create_instructor_course(
    db: Session,
    instructor_id: int,
    title: str,
    description: str,
    category: str,
    difficulty: str,
    is_premium: bool = False,
    thumbnail_url: str | None = None,
) -> Course:
    """Create a new course as instructor."""
    instructor = db.get(User, instructor_id)
    if instructor is None:
        raise HTTPException(status_code=404, detail='User not found')

    course = Course(
        title=title,
        description=description,
        category=category,
        difficulty=difficulty,
        is_premium=is_premium,
        thumbnail_url=thumbnail_url,
        instructor_id=instructor_id,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def update_instructor_course(
    db: Session,
    course_id: int,
    instructor_id: int,
    title: str | None = None,
    description: str | None = None,
    category: str | None = None,
    difficulty: str | None = None,
    is_premium: bool | None = None,
    thumbnail_url: str | None = None,
) -> Course:
    """Update instructor's course."""
    course = get_course_by_instructor(db, course_id, instructor_id)

    if title is not None:
        course.title = title
    if description is not None:
        course.description = description
    if category is not None:
        course.category = category
    if difficulty is not None:
        course.difficulty = difficulty
    if is_premium is not None:
        course.is_premium = is_premium
    if thumbnail_url is not None:
        course.thumbnail_url = thumbnail_url

    db.commit()
    db.refresh(course)
    return course


def delete_instructor_course(db: Session, course_id: int, instructor_id: int) -> None:
    """Delete instructor's course."""
    course = get_course_by_instructor(db, course_id, instructor_id)
    db.delete(course)
    db.commit()


def create_module(db: Session, course_id: int, instructor_id: int, title: str) -> Module:
    """Create module in instructor's course."""
    course = get_course_by_instructor(db, course_id, instructor_id)
    module = Module(title=title, course_id=course_id)
    db.add(module)
    db.commit()
    db.refresh(module)
    return module


def update_module(db: Session, module_id: int, instructor_id: int, title: str | None = None) -> Module:
    """Update module title, checking instructor owns parent course."""
    module = db.get(Module, module_id)
    if module is None:
        raise HTTPException(status_code=404, detail='Module not found')

    get_course_by_instructor(db, module.course_id, instructor_id)

    if title is not None:
        module.title = title

    db.commit()
    db.refresh(module)
    return module


def delete_module(db: Session, module_id: int, instructor_id: int) -> None:
    """Delete module, checking instructor owns parent course."""
    module = db.get(Module, module_id)
    if module is None:
        raise HTTPException(status_code=404, detail='Module not found')

    get_course_by_instructor(db, module.course_id, instructor_id)
    db.delete(module)
    db.commit()


def create_lesson(
    db: Session,
    module_id: int,
    instructor_id: int,
    title: str,
    content: str,
    difficulty: str = 'medium',
    order_index: int = 1,
    quiz_question: str | None = None,
    quiz_options: str | None = None,
    correct_answer: str | None = None,
    video_url: str | None = None,
    video_duration_seconds: int | None = None,
) -> Lesson:
    """Create lesson in instructor's module."""
    module = db.get(Module, module_id)
    if module is None:
        raise HTTPException(status_code=404, detail='Module not found')

    get_course_by_instructor(db, module.course_id, instructor_id)

    lesson = Lesson(
        title=title,
        content=content,
        difficulty=difficulty,
        module_id=module.id,
        order_index=order_index,
        quiz_question=quiz_question,
        quiz_options=quiz_options,
        correct_answer=correct_answer,
        video_url=video_url,
        video_duration_seconds=video_duration_seconds,
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson


def update_lesson(
    db: Session,
    lesson_id: int,
    instructor_id: int,
    title: str | None = None,
    content: str | None = None,
    difficulty: str | None = None,
    order_index: int | None = None,
    quiz_question: str | None = None,
    quiz_options: str | None = None,
    correct_answer: str | None = None,
    video_url: str | None = None,
    video_duration_seconds: int | None = None,
) -> Lesson:
    """Update lesson, checking instructor owns parent course."""
    lesson = db.get(Lesson, lesson_id)
    if lesson is None:
        raise HTTPException(status_code=404, detail='Lesson not found')

    module = lesson.module
    if module is None:
        raise HTTPException(status_code=404, detail='Module not found')

    get_course_by_instructor(db, module.course_id, instructor_id)

    if title is not None:
        lesson.title = title
    if content is not None:
        lesson.content = content
    if difficulty is not None:
        lesson.difficulty = difficulty
    if order_index is not None:
        lesson.order_index = order_index
    if quiz_question is not None:
        lesson.quiz_question = quiz_question
    if quiz_options is not None:
        lesson.quiz_options = quiz_options
    if correct_answer is not None:
        lesson.correct_answer = correct_answer
    if video_url is not None:
        lesson.video_url = video_url
    if video_duration_seconds is not None:
        lesson.video_duration_seconds = video_duration_seconds

    db.commit()
    db.refresh(lesson)
    return lesson


def delete_lesson(db: Session, lesson_id: int, instructor_id: int) -> None:
    """Delete lesson, checking instructor owns parent course."""
    lesson = db.get(Lesson, lesson_id)
    if lesson is None:
        raise HTTPException(status_code=404, detail='Lesson not found')

    module = lesson.module
    if module is None:
        raise HTTPException(status_code=404, detail='Module not found')

    get_course_by_instructor(db, module.course_id, instructor_id)
    db.delete(lesson)
    db.commit()
