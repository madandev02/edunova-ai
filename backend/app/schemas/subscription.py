from pydantic import BaseModel


class CheckoutSessionIn(BaseModel):
    plan: str


class CheckoutSessionOut(BaseModel):
    checkout_url: str
    session_id: str


class SubscriptionStatusOut(BaseModel):
    plan: str
    status: str
    is_active: bool
    last_payment_at: str | None = None


class StripeWebhookOut(BaseModel):
    received: bool


class CustomerPortalSessionOut(BaseModel):
    portal_url: str


class SubscriptionWebhookEventOut(BaseModel):
    id: int
    stripe_event_id: str | None = None
    event_type: str
    user_id: int | None = None
    status: str
    error_message: str | None = None
    payload_json: str | None = None
    created_at: str


class SubscriptionWebhookEventListOut(BaseModel):
    items: list[SubscriptionWebhookEventOut]


class RetryWebhookEventOut(BaseModel):
    retried: bool
    event_id: int
    status: str