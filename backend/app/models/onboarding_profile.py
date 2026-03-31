from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class OnboardingProfile(Base):
    __tablename__ = 'onboarding_profiles'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), unique=True, index=True)
    goal: Mapped[str] = mapped_column(String(120))
    interests: Mapped[str] = mapped_column(Text)
    level: Mapped[str] = mapped_column(String(40))
    assessment_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    first_course_id: Mapped[int | None] = mapped_column(ForeignKey('courses.id', ondelete='SET NULL'), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship('User')
