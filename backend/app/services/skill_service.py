from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.course import Lesson
from app.models.skill_profile import SkillProfile


def _baseline_for_level(level: str) -> float:
    normalized = level.upper()
    if normalized == 'ADVANCED':
        return 0.72
    if normalized == 'INTERMEDIATE':
        return 0.55
    return 0.38


def bootstrap_skill_profile(
    db: Session,
    user_id: int,
    interests: list[str],
    assigned_level: str,
) -> None:
    baseline = _baseline_for_level(assigned_level)
    topics = {item.strip().lower() for item in interests if item.strip()}
    if not topics:
        topics = {'backend', 'frontend', 'ai'}

    existing_topics = {
        item.topic
        for item in db.scalars(select(SkillProfile).where(SkillProfile.user_id == user_id)).all()
    }

    for topic in topics:
        if topic in existing_topics:
            continue
        db.add(SkillProfile(user_id=user_id, topic=topic, score=baseline))


def update_skills_from_attempt(
    db: Session,
    user_id: int,
    lesson: Lesson,
    score: float,
    attempts: int,
    time_spent_seconds: int,
) -> None:
    topic = (
        lesson.module.title.lower()
        if lesson.module is not None
        else lesson.title.lower().split(' ')[0]
    )

    skill = db.scalar(
        select(SkillProfile).where(
            SkillProfile.user_id == user_id,
            SkillProfile.topic == topic,
        )
    )

    if skill is None:
        skill = SkillProfile(user_id=user_id, topic=topic, score=0.5)
        db.add(skill)

    score_factor = max(0.0, min(score / 100.0, 1.0))
    attempt_factor = max(0.45, 1 - max(0, attempts - 1) * 0.08)
    time_factor = max(0.35, min(time_spent_seconds / 900.0, 1.0))

    target = (score_factor * 0.7) + (attempt_factor * 0.15) + (time_factor * 0.15)
    skill.score = round((skill.score * 0.65) + (target * 0.35), 3)


def get_skill_map(db: Session, user_id: int) -> dict[str, float]:
    profiles = db.scalars(select(SkillProfile).where(SkillProfile.user_id == user_id)).all()
    return {item.topic: round(item.score, 3) for item in profiles}
