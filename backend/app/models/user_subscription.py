from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserSubscription(Base):
    __tablename__ = 'user_subscriptions'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), unique=True, index=True)
    plan: Mapped[str] = mapped_column(String(32), default='free')
    status: Mapped[str] = mapped_column(String(32), default='inactive')
    stripe_customer_id: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    last_payment_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user = relationship('User', back_populates='subscriptions')