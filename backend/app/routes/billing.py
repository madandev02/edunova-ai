import json
from datetime import datetime, timezone

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.models.subscription_webhook_event import SubscriptionWebhookEvent
from app.models.user_subscription import UserSubscription
from app.schemas.subscription import (
    CheckoutSessionIn,
    CheckoutSessionOut,
    CustomerPortalSessionOut,
    RetryWebhookEventOut,
    StripeWebhookOut,
    SubscriptionStatusOut,
    SubscriptionWebhookEventListOut,
    SubscriptionWebhookEventOut,
)
from app.services.context_service import get_current_admin_user_id, get_current_user_id
from app.services.subscription_service import (
    get_or_create_subscription,
    get_plan_from_price_id,
    get_price_id_for_plan,
)

router = APIRouter(prefix='/billing', tags=['billing'])


def _process_stripe_event(event: dict, db: Session) -> None:
    event_type = str(event.get('type', ''))
    data_object = event.get('data', {}).get('object', {})

    if event_type == 'checkout.session.completed':
        user_id_raw = data_object.get('client_reference_id') or data_object.get('metadata', {}).get('user_id')
        if user_id_raw and str(user_id_raw).isdigit():
            user_id = int(user_id_raw)
            subscription = get_or_create_subscription(db=db, user_id=user_id)
            line_items = stripe.checkout.Session.list_line_items(data_object.get('id'), limit=1)
            first_price_id = None
            if line_items and getattr(line_items, 'data', None):
                first_item = line_items.data[0]
                first_price_id = first_item.get('price', {}).get('id')

            subscription.plan = get_plan_from_price_id(first_price_id)
            subscription.status = 'active'
            subscription.stripe_customer_id = data_object.get('customer')
            subscription.last_payment_at = datetime.now(timezone.utc)
            db.commit()

    if event_type in {'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'}:
        customer_id = data_object.get('customer')
        if customer_id:
            subscription = db.scalar(select(UserSubscription).where(UserSubscription.stripe_customer_id == customer_id))
            if subscription is not None:
                subscription.status = data_object.get('status', 'inactive')
                items = data_object.get('items', {}).get('data', [])
                if items and isinstance(items, list):
                    first_item = items[0] or {}
                    price_id = first_item.get('price', {}).get('id')
                    if price_id:
                        subscription.plan = get_plan_from_price_id(price_id)
                db.commit()

    if event_type == 'invoice.payment_succeeded':
        customer_id = data_object.get('customer')
        if customer_id:
            subscription = db.scalar(select(UserSubscription).where(UserSubscription.stripe_customer_id == customer_id))
            if subscription is not None:
                subscription.status = 'active'
                subscription.last_payment_at = datetime.now(timezone.utc)
                lines = data_object.get('lines', {}).get('data', [])
                if lines and isinstance(lines, list):
                    first_line = lines[0] or {}
                    price_id = first_line.get('price', {}).get('id')
                    if price_id:
                        subscription.plan = get_plan_from_price_id(price_id)
                db.commit()

    if event_type == 'invoice.payment_failed':
        customer_id = data_object.get('customer')
        if customer_id:
            subscription = db.scalar(select(UserSubscription).where(UserSubscription.stripe_customer_id == customer_id))
            if subscription is not None:
                subscription.status = 'past_due'
                db.commit()


@router.get('/webhook-events', response_model=SubscriptionWebhookEventListOut)
def get_webhook_events(
    limit: int = 20,
    status: str | None = None,
    event_type: str | None = None,
    user_id: int | None = None,
    _: int = Depends(get_current_admin_user_id),
    db: Session = Depends(get_db),
) -> SubscriptionWebhookEventListOut:
    safe_limit = max(1, min(limit, 100))
    query = select(SubscriptionWebhookEvent)
    if status:
        query = query.where(SubscriptionWebhookEvent.status.ilike(status.strip()))
    if event_type:
        query = query.where(SubscriptionWebhookEvent.event_type.ilike(event_type.strip()))
    if user_id is not None:
        query = query.where(SubscriptionWebhookEvent.user_id == user_id)

    events = db.scalars(query.order_by(desc(SubscriptionWebhookEvent.id)).limit(safe_limit)).all()

    return SubscriptionWebhookEventListOut(
        items=[
            SubscriptionWebhookEventOut(
                id=event.id,
                stripe_event_id=event.stripe_event_id,
                event_type=event.event_type,
                user_id=event.user_id,
                status=event.status,
                error_message=event.error_message,
                payload_json=event.payload_json,
                created_at=event.created_at.isoformat(),
            )
            for event in events
        ]
    )


@router.get('/subscription', response_model=SubscriptionStatusOut)
def get_subscription_status(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> SubscriptionStatusOut:
    subscription = get_or_create_subscription(db=db, user_id=user_id)
    is_active = subscription.plan in {'pro', 'premium'} and subscription.status in {'active', 'trialing'}
    return SubscriptionStatusOut(
        plan=subscription.plan,
        status=subscription.status,
        is_active=is_active,
        last_payment_at=subscription.last_payment_at.isoformat() if subscription.last_payment_at else None,
    )


@router.post('/checkout-session', response_model=CheckoutSessionOut)
def create_checkout_session(
    payload: CheckoutSessionIn,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> CheckoutSessionOut:
    settings = get_settings()
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=500, detail='Stripe secret key is not configured.')

    stripe.api_key = settings.stripe_secret_key

    plan = payload.plan.lower().strip()
    price_id = get_price_id_for_plan(plan=plan)
    subscription = get_or_create_subscription(db=db, user_id=user_id)

    checkout_session = stripe.checkout.Session.create(
        mode='subscription',
        line_items=[{'price': price_id, 'quantity': 1}],
        success_url=f'{settings.frontend_url}/pricing?checkout=success',
        cancel_url=f'{settings.frontend_url}/pricing?checkout=cancelled',
        client_reference_id=str(user_id),
        customer=subscription.stripe_customer_id,
        metadata={'user_id': str(user_id), 'plan': plan},
    )

    return CheckoutSessionOut(checkout_url=checkout_session.url, session_id=checkout_session.id)


@router.post('/customer-portal-session', response_model=CustomerPortalSessionOut)
def create_customer_portal_session(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> CustomerPortalSessionOut:
    settings = get_settings()
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=500, detail='Stripe secret key is not configured.')

    stripe.api_key = settings.stripe_secret_key
    subscription = get_or_create_subscription(db=db, user_id=user_id)
    if not subscription.stripe_customer_id:
        raise HTTPException(status_code=400, detail='No Stripe customer found for this account yet.')

    session = stripe.billing_portal.Session.create(
        customer=subscription.stripe_customer_id,
        return_url=f'{settings.frontend_url}/pricing',
    )
    return CustomerPortalSessionOut(portal_url=session.url)


@router.post('/webhook-events/{event_id}/retry', response_model=RetryWebhookEventOut)
def retry_webhook_event(
    event_id: int,
    _: int = Depends(get_current_admin_user_id),
    db: Session = Depends(get_db),
) -> RetryWebhookEventOut:
    settings = get_settings()
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=500, detail='Stripe secret key is not configured.')

    stripe.api_key = settings.stripe_secret_key
    event_log = db.get(SubscriptionWebhookEvent, event_id)
    if event_log is None:
        raise HTTPException(status_code=404, detail='Webhook event not found')

    try:
        event_data = json.loads(event_log.payload_json)
        _process_stripe_event(event_data, db=db)
        event_log.status = 'processed'
        event_log.error_message = None
        db.commit()
    except Exception as error:
        event_log.status = 'failed'
        event_log.error_message = str(error)
        db.commit()
        raise HTTPException(status_code=500, detail=f'Webhook retry failed: {error}') from error

    return RetryWebhookEventOut(retried=True, event_id=event_id, status=event_log.status)


@router.post('/webhook', response_model=StripeWebhookOut)
async def handle_stripe_webhook(request: Request, db: Session = Depends(get_db)) -> StripeWebhookOut:
    settings = get_settings()
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=500, detail='Stripe secret key is not configured.')

    stripe.api_key = settings.stripe_secret_key
    payload = await request.body()
    signature = request.headers.get('stripe-signature')

    event: dict
    event_log: SubscriptionWebhookEvent | None = None
    if settings.stripe_webhook_secret and signature:
        try:
            event = stripe.Webhook.construct_event(payload=payload, sig_header=signature, secret=settings.stripe_webhook_secret)
        except stripe.error.SignatureVerificationError as error:
            raise HTTPException(status_code=400, detail='Invalid Stripe signature.') from error
    else:
        event = json.loads(payload.decode('utf-8'))

    event_type = event.get('type', '')
    event_id = event.get('id')

    existing: SubscriptionWebhookEvent | None = None
    if event_id:
        existing = db.scalar(select(SubscriptionWebhookEvent).where(SubscriptionWebhookEvent.stripe_event_id == str(event_id)))
        if existing is not None and existing.status == 'processed':
            return StripeWebhookOut(received=True)

    data_object = event.get('data', {}).get('object', {})
    user_id_raw = data_object.get('client_reference_id') or data_object.get('metadata', {}).get('user_id')
    event_user_id = int(user_id_raw) if user_id_raw and str(user_id_raw).isdigit() else None
    if existing is None:
        event_log = SubscriptionWebhookEvent(
            stripe_event_id=str(event_id) if event_id else None,
            event_type=event_type or 'unknown',
            user_id=event_user_id,
            status='received',
            payload_json=payload.decode('utf-8', errors='ignore'),
        )
        db.add(event_log)
        db.commit()
        db.refresh(event_log)
    else:
        event_log = existing
        event_log.event_type = event_type or event_log.event_type
        event_log.user_id = event_user_id
        event_log.status = 'received'
        event_log.payload_json = payload.decode('utf-8', errors='ignore')
        event_log.error_message = None
        db.commit()

    try:
        _process_stripe_event(event=event, db=db)

        if event_log is not None:
            event_log.status = 'processed'
            db.commit()
    except Exception as error:
        if event_log is not None:
            event_log.status = 'failed'
            event_log.error_message = str(error)
            db.commit()
        raise HTTPException(status_code=500, detail=f'Webhook processing failed: {error}') from error

    return StripeWebhookOut(received=True)