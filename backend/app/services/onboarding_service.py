import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.learning.engine import generate_daily_plan
from app.models.course import Course
from app.models.onboarding_profile import OnboardingProfile
from app.models.user import User
from app.onboarding.engine import assessment_percentage, choose_first_course, infer_level
from app.schemas.onboarding import OnboardingIn
from app.services.recommendation_service import refresh_recommendations
from app.services.skill_service import bootstrap_skill_profile


def get_onboarding_status(db: Session, user_id: int) -> dict:
    profile = db.scalar(select(OnboardingProfile).where(OnboardingProfile.user_id == user_id))
    if profile is None:
        return {'completed': False, 'level': None, 'first_course_id': None}

    return {
        'completed': True,
        'level': profile.level,
        'first_course_id': profile.first_course_id,
    }


def complete_onboarding(db: Session, user_id: int, payload: OnboardingIn) -> dict:
    user = db.scalar(select(User).where(User.id == user_id))
    if user is None:
        raise ValueError('User not found')

    assigned_level = infer_level(payload.experience_level, payload.assessment_answers)
    score_percentage = assessment_percentage(payload.assessment_answers)

    courses = db.scalars(select(Course).order_by(Course.id.asc())).all()
    first_course = choose_first_course(
        courses=courses,
        goal=payload.goal,
        interests=payload.interests,
        learner_level=assigned_level,
    )

    profile = db.scalar(select(OnboardingProfile).where(OnboardingProfile.user_id == user_id))
    if profile is None:
        profile = OnboardingProfile(
            user_id=user_id,
            goal=payload.goal,
            interests=json.dumps(payload.interests),
            level=assigned_level,
            assessment_score=score_percentage,
            first_course_id=first_course.id if first_course else None,
        )
        db.add(profile)
    else:
        profile.goal = payload.goal
        profile.interests = json.dumps(payload.interests)
        profile.level = assigned_level
        profile.assessment_score = score_percentage
        profile.first_course_id = first_course.id if first_course else None

    user.level = assigned_level

    bootstrap_skill_profile(
        db=db,
        user_id=user_id,
        interests=payload.interests,
        assigned_level=assigned_level,
    )

    db.commit()
    refresh_recommendations(db=db, user_id=user_id)

    learning_path = generate_daily_plan(db=db, user_id=user_id, limit=8)

    return {
        'level': assigned_level,
        'assessment_score': score_percentage,
        'first_course_id': first_course.id if first_course else None,
        'first_course_title': first_course.title if first_course else None,
        'generated_learning_path_lesson_ids': [item['id'] for item in learning_path['items']],
        'rationale': (
            f'Based on your assessment signals and selected interests, we assigned {assigned_level} '
            f'and prioritized {first_course.title if first_course else "a general foundation track"} as your best starting point.'
        ),
    }
