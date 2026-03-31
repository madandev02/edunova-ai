import json
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user_gamification import UserGamification


def get_or_create_gamification(db: Session, user_id: int) -> UserGamification:
    profile = db.scalar(select(UserGamification).where(UserGamification.user_id == user_id))
    if profile is None:
        profile = UserGamification(user_id=user_id, xp=0, level=1, streak_days=0, achievements_json='[]')
        db.add(profile)
    return profile


def _append_achievement(achievements: list[str], key: str) -> list[str]:
    if key not in achievements:
        achievements.append(key)
    return achievements


def apply_learning_event(db: Session, user_id: int, score: float, completed: bool) -> UserGamification:
    profile = get_or_create_gamification(db=db, user_id=user_id)

    xp_gain = 8 + int(score / 10)
    if completed:
        xp_gain += 20

    profile.xp += xp_gain
    profile.level = max(1, (profile.xp // 250) + 1)

    today = date.today()
    if profile.last_active_date is None:
        profile.streak_days = 1
    elif profile.last_active_date == today:
        pass
    elif profile.last_active_date == today - timedelta(days=1):
        profile.streak_days += 1
    else:
        profile.streak_days = 1

    profile.last_active_date = today

    achievements = json.loads(profile.achievements_json)
    if completed:
        achievements = _append_achievement(achievements, 'first_completion')
    if profile.streak_days >= 3:
        achievements = _append_achievement(achievements, 'streak_3')
    if profile.xp >= 500:
        achievements = _append_achievement(achievements, 'xp_500')

    profile.achievements_json = json.dumps(achievements)
    return profile
