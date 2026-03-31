from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CourseDiscussionPost(Base):
    __tablename__ = 'course_discussion_posts'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    course_id: Mapped[int] = mapped_column(ForeignKey('courses.id', ondelete='CASCADE'), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), index=True)
    parent_id: Mapped[int | None] = mapped_column(ForeignKey('course_discussion_posts.id', ondelete='CASCADE'), nullable=True, index=True)
    kind: Mapped[str] = mapped_column(String(16), default='question')
    body: Mapped[str] = mapped_column(Text)
    accepted_answer: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    course = relationship('Course', back_populates='discussion_posts')
    user = relationship('User', back_populates='discussion_posts')