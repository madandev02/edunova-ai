from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.user_subscription import UserSubscription


PAID_PLANS = {'pro', 'premium'}
ACTIVE_STATUSES = {'active', 'trialing'}


def get_or_create_subscription(db: Session, user_id: int) -> UserSubscription:
    subscription = db.scalar(select(UserSubscription).where(UserSubscription.user_id == user_id))
    if subscription is not None:
        return subscription

    subscription = UserSubscription(user_id=user_id, plan='free', status='inactive')
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return subscription


def user_has_paid_access(subscription: UserSubscription | None) -> bool:
    if subscription is None:
        return False
    return subscription.plan in PAID_PLANS and subscription.status in ACTIVE_STATUSES


def ensure_premium_access(db: Session, user_id: int, is_premium: bool) -> None:
    if not is_premium:
        return

    subscription = db.scalar(select(UserSubscription).where(UserSubscription.user_id == user_id))
    if user_has_paid_access(subscription):
        return

    raise HTTPException(status_code=402, detail='This premium course requires an active Pro or Premium plan.')


def get_price_id_for_plan(plan: str) -> str:
    settings = get_settings()
    normalized = plan.lower().strip()
    if normalized == 'pro':
        if not settings.stripe_price_id_pro:
            raise HTTPException(status_code=500, detail='Stripe Pro price ID is not configured.')
        return settings.stripe_price_id_pro

    if normalized == 'premium':
        if not settings.stripe_price_id_premium:
            raise HTTPException(status_code=500, detail='Stripe Premium price ID is not configured.')
        return settings.stripe_price_id_premium

    raise HTTPException(status_code=400, detail='Unsupported plan. Choose pro or premium.')


def get_plan_from_price_id(price_id: str | None) -> str:
    settings = get_settings()
    if price_id == settings.stripe_price_id_pro:
        return 'pro'
    if price_id == settings.stripe_price_id_premium:
        return 'premium'
    return 'free'