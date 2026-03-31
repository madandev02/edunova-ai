from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.course import CourseOut
from app.services.course_service import build_course_quality_bundle, list_courses

router = APIRouter(prefix='/public', tags=['public'])


@router.get('/courses', response_model=list[CourseOut])
def get_public_courses(
    category: str | None = Query(default=None),
    difficulty: str | None = Query(default=None),
    search: str | None = Query(default=None),
    limit: int = Query(default=6, ge=1, le=24),
    db: Session = Depends(get_db),
) -> list[CourseOut]:
    courses = list_courses(db=db, category=category, difficulty=difficulty, search=search)[:limit]
    output: list[CourseOut] = []

    for course in courses:
        quality = build_course_quality_bundle(course)
        modules_count = len(course.modules)
        lessons_count = sum(len(module.lessons) for module in course.modules)
        estimated_time_hours = max(1, round(lessons_count * 0.6))

        output.append(
            CourseOut(
                id=course.id,
                title=course.title,
                description=course.description,
                category=course.category,
                difficulty=course.difficulty,
                is_premium=course.is_premium,
                is_locked=course.is_premium,
                estimated_time_hours=estimated_time_hours,
                lessons_count=lessons_count,
                modules_count=modules_count,
                learning_objectives=quality['learning_objectives'],
                prerequisites=quality['prerequisites'],
            )
        )

    return output