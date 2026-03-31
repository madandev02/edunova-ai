from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TranscriptNote(Base):
    __tablename__ = 'transcript_notes'
    __table_args__ = (
        UniqueConstraint('user_id', 'lesson_id', 'segment_id', name='uq_transcript_note_user_lesson_segment'),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), index=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey('lessons.id', ondelete='CASCADE'), index=True)
    segment_id: Mapped[str] = mapped_column(String(80), index=True)
    highlight_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    note_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship('User')
    lesson = relationship('Lesson')