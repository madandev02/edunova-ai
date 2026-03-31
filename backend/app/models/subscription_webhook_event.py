from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SubscriptionWebhookEvent(Base):
    __tablename__ = 'subscription_webhook_events'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    stripe_event_id: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True, unique=True)
    event_type: Mapped[str] = mapped_column(String(120), index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(24), default='received')
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    payload_json: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)