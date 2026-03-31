from __future__ import annotations

import json

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.course import Course, Module
from app.services.content_mapping_service import (
    build_topic_aligned_quiz_question,
    choose_curated_video,
    extract_key_concepts,
)


def _normalize(value: str) -> str:
    return value.strip().lower()


def build_content_alignment_report(db: Session) -> dict:
    courses = db.scalars(
        select(Course)
        .options(selectinload(Course.modules).selectinload(Module.lessons))
        .order_by(Course.id.asc())
    ).all()

    issues: list[dict] = []
    counts = {
        'courses': len(courses),
        'modules': 0,
        'lessons': 0,
        'video_mismatch': 0,
        'quiz_mismatch': 0,
        'structure_mismatch': 0,
    }

    for course in courses:
        if not course.modules:
            counts['structure_mismatch'] += 1
            issues.append(
                {
                    'type': 'structure_mismatch',
                    'severity': 'high',
                    'course_id': course.id,
                    'course_title': course.title,
                    'message': 'Course has no modules.',
                }
            )

        for module in course.modules:
            counts['modules'] += 1
            if module.course_id != course.id:
                counts['structure_mismatch'] += 1
                issues.append(
                    {
                        'type': 'structure_mismatch',
                        'severity': 'high',
                        'course_id': course.id,
                        'module_id': module.id,
                        'course_title': course.title,
                        'module_title': module.title,
                        'message': 'Module references a different course id.',
                    }
                )

            if not module.lessons:
                counts['structure_mismatch'] += 1
                issues.append(
                    {
                        'type': 'structure_mismatch',
                        'severity': 'high',
                        'course_id': course.id,
                        'module_id': module.id,
                        'course_title': course.title,
                        'module_title': module.title,
                        'message': 'Module has no lessons.',
                    }
                )

            for lesson in module.lessons:
                counts['lessons'] += 1

                if lesson.module_id != module.id:
                    counts['structure_mismatch'] += 1
                    issues.append(
                        {
                            'type': 'structure_mismatch',
                            'severity': 'high',
                            'course_id': course.id,
                            'module_id': module.id,
                            'lesson_id': lesson.id,
                            'course_title': course.title,
                            'module_title': module.title,
                            'lesson_title': lesson.title,
                            'message': 'Lesson references a different module id.',
                        }
                    )

                expected_video = choose_curated_video(
                    lesson_title=lesson.title,
                    module_title=module.title,
                    course_category=course.category,
                )
                if _normalize(lesson.video_url or '') != _normalize(expected_video['video_url']):
                    counts['video_mismatch'] += 1
                    issues.append(
                        {
                            'type': 'video_mismatch',
                            'severity': 'medium',
                            'course_id': course.id,
                            'module_id': module.id,
                            'lesson_id': lesson.id,
                            'course_title': course.title,
                            'module_title': module.title,
                            'lesson_title': lesson.title,
                            'message': 'Video URL does not match expected curated topic mapping.',
                            'expected_video_url': expected_video['video_url'],
                            'actual_video_url': lesson.video_url,
                        }
                    )

                key_concepts = extract_key_concepts(
                    lesson_title=lesson.title,
                    module_title=module.title,
                    content=lesson.content,
                )
                quiz_text = f'{lesson.quiz_question or ""} {lesson.correct_answer or ""}'.lower()
                if key_concepts and not any(concept.lower() in quiz_text for concept in key_concepts[:2]):
                    counts['quiz_mismatch'] += 1
                    issues.append(
                        {
                            'type': 'quiz_mismatch',
                            'severity': 'medium',
                            'course_id': course.id,
                            'module_id': module.id,
                            'lesson_id': lesson.id,
                            'course_title': course.title,
                            'module_title': module.title,
                            'lesson_title': lesson.title,
                            'message': 'Quiz prompt/answer appears weakly aligned to lesson key concepts.',
                            'key_concepts': key_concepts[:3],
                        }
                    )

    healthy = (
        counts['video_mismatch'] == 0
        and counts['quiz_mismatch'] == 0
        and counts['structure_mismatch'] == 0
    )

    return {
        'healthy': healthy,
        'summary': {
            **counts,
            'issues_total': len(issues),
        },
        'issues': issues,
    }


def apply_content_alignment_fixes(db: Session, dry_run: bool = True) -> dict:
    courses = db.scalars(
        select(Course)
        .options(selectinload(Course.modules).selectinload(Module.lessons))
        .order_by(Course.id.asc())
    ).all()

    proposed_fixes: list[dict] = []
    non_fixable: list[dict] = []

    for course in courses:
        if not course.modules:
            non_fixable.append(
                {
                    'type': 'structure_mismatch',
                    'course_id': course.id,
                    'course_title': course.title,
                    'message': 'Course has no modules; requires manual content authoring.',
                }
            )
            continue

        for module in course.modules:
            if not module.lessons:
                non_fixable.append(
                    {
                        'type': 'structure_mismatch',
                        'course_id': course.id,
                        'module_id': module.id,
                        'course_title': course.title,
                        'module_title': module.title,
                        'message': 'Module has no lessons; requires manual content authoring.',
                    }
                )
                continue

            for lesson in module.lessons:
                expected_video = choose_curated_video(
                    lesson_title=lesson.title,
                    module_title=module.title,
                    course_category=course.category,
                )

                if _normalize(lesson.video_url or '') != _normalize(expected_video['video_url']):
                    proposed_fixes.append(
                        {
                            'kind': 'video_alignment',
                            'lesson_id': lesson.id,
                            'lesson_title': lesson.title,
                            'before': {'video_url': lesson.video_url, 'video_duration_seconds': lesson.video_duration_seconds},
                            'after': {'video_url': expected_video['video_url'], 'video_duration_seconds': expected_video['video_duration_seconds']},
                        }
                    )
                    if not dry_run:
                        lesson.video_url = expected_video['video_url']
                        lesson.video_duration_seconds = expected_video['video_duration_seconds']

                key_concepts = extract_key_concepts(
                    lesson_title=lesson.title,
                    module_title=module.title,
                    content=lesson.content,
                )
                quiz_text = f'{lesson.quiz_question or ""} {lesson.correct_answer or ""}'.lower()
                if key_concepts and not any(concept.lower() in quiz_text for concept in key_concepts[:2]):
                    aligned_question = build_topic_aligned_quiz_question(
                        lesson_title=lesson.title,
                        key_concepts=key_concepts,
                    )
                    aligned_options = [
                        f"It clarifies {key_concepts[0].lower()} through practical examples.",
                        'It removes the need for deliberate practice.',
                        'It is unrelated to the lesson objective.',
                    ]

                    proposed_fixes.append(
                        {
                            'kind': 'quiz_alignment',
                            'lesson_id': lesson.id,
                            'lesson_title': lesson.title,
                            'before': {
                                'quiz_question': lesson.quiz_question,
                                'correct_answer': lesson.correct_answer,
                            },
                            'after': {
                                'quiz_question': aligned_question,
                                'correct_answer': aligned_options[0],
                            },
                        }
                    )
                    if not dry_run:
                        lesson.quiz_question = aligned_question
                        lesson.quiz_options = json.dumps(aligned_options)
                        lesson.correct_answer = aligned_options[0]

    if not dry_run:
        db.commit()

    post_report = build_content_alignment_report(db=db)
    return {
        'dry_run': dry_run,
        'proposed_fixes_total': len(proposed_fixes),
        'applied_fixes_total': 0 if dry_run else len(proposed_fixes),
        'non_fixable_total': len(non_fixable),
        'proposed_fixes': proposed_fixes,
        'non_fixable': non_fixable,
        'post_report': post_report,
    }
