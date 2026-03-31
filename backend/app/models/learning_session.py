from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class LearningSession(Base):
    __tablename__ = 'learning_sessions'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), index=True)
    lesson_id: Mapped[int | None] = mapped_column(ForeignKey('lessons.id', ondelete='CASCADE'), nullable=True, index=True)
    playback_seconds: Mapped[int] = mapped_column(Integer, default=0)
    watched_sections_json: Mapped[str] = mapped_column(Text, default='[]')
    completion_ratio: Mapped[float] = mapped_column(Float, default=0.0)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship('User', back_populates='sessions')
    lesson = relationship('Lesson')
