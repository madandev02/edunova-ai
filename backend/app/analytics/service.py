import json
from collections import defaultdict

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.course import Lesson
from app.models.learning_session import LearningSession
from app.models.progress import Progress
from app.models.skill_profile import SkillProfile
from app.models.user import User
from app.models.user_gamification import UserGamification
from app.services.recommendation_service import get_recommendations_for_user
from app.services.progress_service import get_resume_lessons


def _safe_rate(total: float, count: int) -> float:
    return round(total / count, 2) if count else 0.0


def build_analytics(db: Session, user_id: int) -> dict:
    progress_rows = db.scalars(
        select(Progress)
        .where(Progress.user_id == user_id)
        .options(selectinload(Progress.lesson).selectinload(Lesson.module))
        .order_by(Progress.updated_at.asc())
    ).all()

    video_rows = db.scalars(
        select(LearningSession)
        .where(
            LearningSession.user_id == user_id,
            LearningSession.lesson_id.is_not(None),
        )
        .options(selectinload(LearningSession.lesson).selectinload(Lesson.module))
        .order_by(LearningSession.updated_at.asc())
    ).all()

    total_lessons = db.scalar(select(func.count()).select_from(Lesson)) or 0
    completed_count = sum(1 for row in progress_rows if row.completed)
    success_rate = _safe_rate(sum(row.score for row in progress_rows), len(progress_rows))
    overall_progress = round((completed_count / total_lessons) * 100, 2) if total_lessons else 0.0

    topic_scores: dict[str, list[float]] = defaultdict(list)
    topic_attempts: dict[str, int] = defaultdict(int)

    for row in progress_rows:
        topic = row.lesson.module.title if row.lesson and row.lesson.module else 'General'
        topic_scores[topic].append(row.score)
        topic_attempts[topic] += row.attempts

    weak_areas = [
        {'topic': topic, 'score': _safe_rate(sum(scores), len(scores))}
        for topic, scores in topic_scores.items()
        if _safe_rate(sum(scores), len(scores)) < 60
    ]

    performance_over_time = [
        {
            'date': row.updated_at.strftime('%Y-%m-%d'),
            'score': round(row.score, 2),
        }
        for row in progress_rows
    ]

    success_rate_by_topic = [
        {
            'topic': topic,
            'rate': _safe_rate(sum(scores), len(scores)),
        }
        for topic, scores in topic_scores.items()
    ]

    attempts_per_topic = [
        {
            'topic': topic,
            'attempts': attempts,
        }
        for topic, attempts in topic_attempts.items()
    ]

    video_engagement = [
        {
            'lesson': row.lesson.title if row.lesson else f'Lesson {row.lesson_id}',
            'topic': row.lesson.module.title if row.lesson and row.lesson.module else 'General',
            'completion_ratio': round(row.completion_ratio or 0.0, 3),
            'playback_seconds': row.playback_seconds,
        }
        for row in video_rows
    ]

    average_video_completion = _safe_rate(
        sum((row.completion_ratio or 0.0) * 100 for row in video_rows),
        len(video_rows),
    )

    return {
        'overall_progress': overall_progress,
        'success_rate': success_rate,
        'weak_areas': weak_areas,
        'performance_over_time': performance_over_time,
        'success_rate_by_topic': success_rate_by_topic,
        'attempts_per_topic': attempts_per_topic,
        'video_engagement': video_engagement,
        'average_video_completion': average_video_completion,
    }


def build_dashboard(db: Session, user_id: int) -> dict:
    user = db.scalar(select(User).where(User.id == user_id))
    analytics = build_analytics(db=db, user_id=user_id)
    progress_rows = db.scalars(
        select(Progress)
        .where(Progress.user_id == user_id)
        .options(selectinload(Progress.lesson).selectinload(Lesson.module))
        .order_by(Progress.updated_at.desc())
    ).all()

    recommendations = get_recommendations_for_user(db=db, user_id=user_id)
    gamification = db.scalar(select(UserGamification).where(UserGamification.user_id == user_id))
    skill_profiles = db.scalars(select(SkillProfile).where(SkillProfile.user_id == user_id)).all()

    achievements: list[str] = []
    if gamification is not None:
        achievements = json.loads(gamification.achievements_json)

    recent_activity = [
        {
            'id': f'{row.id}',
            'topic': row.lesson.title if row.lesson else 'Unknown',
            'score': round(row.score, 2),
            'attempted_at': row.updated_at.isoformat(),
        }
        for row in progress_rows[:8]
    ]
    resume_lessons = get_resume_lessons(db=db, user_id=user_id, limit=4)

    return {
        'progress': {
            'percentage': analytics['overall_progress'],
            'currentLevel': user.level if user else 'BEGINNER',
        },
        'gamification': {
            'xp': gamification.xp if gamification else 0,
            'level': gamification.level if gamification else 1,
            'streakDays': gamification.streak_days if gamification else 0,
            'achievements': achievements,
        },
        'skillProfile': [
            {
                'topic': item.topic,
                'score': round(item.score, 3),
            }
            for item in skill_profiles
        ],
        'weakAreas': analytics['weak_areas'],
        'recommendations': recommendations,
        'recentActivity': recent_activity,
        'resumeLessons': resume_lessons,
    }
