import json

from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.course import Course, Lesson, Module
from app.services.content_mapping_service import (
    build_course_learning_objectives,
    build_course_prerequisites,
    build_lesson_goal,
    choose_curated_video,
    extract_key_concepts,
    is_generic_video,
)


def list_courses(
    db: Session,
    category: str | None = None,
    difficulty: str | None = None,
    search: str | None = None,
) -> list[Course]:
    query = select(Course).options(selectinload(Course.modules).selectinload(Module.lessons))
    if category:
        query = query.where(Course.category.ilike(category.strip()))
    if difficulty:
        query = query.where(Course.difficulty.ilike(difficulty.strip()))
    if search:
        term = f'%{search.strip()}%'
        query = query.where(or_(Course.title.ilike(term), Course.description.ilike(term)))

    return db.scalars(query.order_by(Course.id.asc())).all()


def get_course_or_404(db: Session, course_id: int) -> Course:
    course = db.scalar(
        select(Course)
        .where(Course.id == course_id)
        .options(selectinload(Course.modules).selectinload(Module.lessons))
    )
    if course is None:
        raise HTTPException(status_code=404, detail='Course not found')
    return course


def list_modules(db: Session, course_id: int | None = None) -> list[Module]:
    query = select(Module)
    if course_id is not None:
        query = query.where(Module.course_id == course_id)
    return db.scalars(query.order_by(Module.id.asc())).all()


def list_lessons(db: Session, module_id: int | None = None) -> list[Lesson]:
    query = select(Lesson)
    if module_id is not None:
        query = query.where(Lesson.module_id == module_id)
    return db.scalars(query.order_by(Lesson.module_id.asc(), Lesson.order_index.asc())).all()


def get_lesson_or_404(db: Session, lesson_id: int) -> Lesson:
    lesson = db.scalar(
        select(Lesson)
        .where(Lesson.id == lesson_id)
        .options(selectinload(Lesson.module).selectinload(Module.course))
    )
    if lesson is None:
        raise HTTPException(status_code=404, detail='Lesson not found')

    module_title = lesson.module.title if lesson.module else 'General'
    course_category = lesson.module.course.category if lesson.module and lesson.module.course else 'General'
    if lesson.video_url is None or is_generic_video(lesson.video_url):
        video_bundle = choose_curated_video(
            lesson_title=lesson.title,
            module_title=module_title,
            course_category=course_category,
        )
        lesson.video_url = video_bundle['video_url']
        lesson.video_duration_seconds = video_bundle['video_duration_seconds']
        db.commit()

    return lesson


def parse_lesson_content(lesson: Lesson) -> list[dict]:
    chunks = [chunk.strip() for chunk in lesson.content.split('\n\n') if chunk.strip()]
    if not chunks:
        chunks = [lesson.content]

    blocks: list[dict] = []
    for index, text in enumerate(chunks):
        heading = text.split('.')[0].strip()
        section_title = heading if 8 <= len(heading) <= 72 else f'Concept {index + 1}'
        blocks.append(
            {
                'id': f'{lesson.id}-{index}',
                'title': section_title,
                'body': text,
            }
        )

    return blocks


def parse_quiz_options(lesson: Lesson) -> list[dict] | None:
    if not lesson.quiz_options:
        return None

    try:
        options = json.loads(lesson.quiz_options)
    except json.JSONDecodeError:
        return None

    if not isinstance(options, list):
        return None

    return [
        {
            'id': f'{lesson.id}-opt-{index}',
            'label': str(item),
            'value': str(item),
        }
        for index, item in enumerate(options)
    ]


def build_video_sections(lesson: Lesson, content_blocks: list[dict]) -> list[dict]:
    if not lesson.video_url or not content_blocks:
        return []

    duration = lesson.video_duration_seconds or max(300, len(content_blocks) * 120)
    segment = max(30, duration // len(content_blocks))

    sections: list[dict] = []
    for index, block in enumerate(content_blocks):
        sections.append(
            {
                'id': f'{lesson.id}-section-{index + 1}',
                'label': block['title'],
                'start_seconds': min(duration, index * segment),
            }
        )
    return sections


def build_transcript_segments(lesson: Lesson, content_blocks: list[dict]) -> list[dict]:
    if not lesson.video_url or not content_blocks:
        return []

    duration = lesson.video_duration_seconds or max(300, len(content_blocks) * 120)
    segment = max(20, duration // len(content_blocks))

    segments: list[dict] = []
    for index, block in enumerate(content_blocks):
        transcript_text = block['body'].strip()
        if len(transcript_text) < 60:
            transcript_text = (
                f"In this segment about {lesson.title.lower()}, {block['body'].strip()} "
                'Focus on how this concept connects to the quiz and practical decisions.'
            )

        segments.append(
            {
                'id': f'{lesson.id}-transcript-{index + 1}',
                'start_seconds': min(duration, index * segment),
                'text': transcript_text,
            }
        )

    return segments


def build_lesson_quality_bundle(lesson: Lesson) -> dict:
    module_title = lesson.module.title if lesson.module else 'General'
    key_concepts = extract_key_concepts(
        lesson_title=lesson.title,
        module_title=module_title,
        content=lesson.content,
    )
    lesson_goal = build_lesson_goal(lesson_title=lesson.title, module_title=module_title)
    return {
        'lesson_goal': lesson_goal,
        'key_concepts': key_concepts,
    }


def build_course_quality_bundle(course: Course) -> dict:
    module_titles = [module.title for module in course.modules]
    objectives = build_course_learning_objectives(
        course_title=course.title,
        module_titles=module_titles,
    )
    prerequisites = build_course_prerequisites(
        difficulty=course.difficulty,
        category=course.category,
    )
    return {
        'learning_objectives': objectives,
        'prerequisites': prerequisites,
    }
