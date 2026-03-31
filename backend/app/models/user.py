from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(24), default='student', index=True)
    level: Mapped[str] = mapped_column(String(40), default='BEGINNER')
    learning_style: Mapped[str] = mapped_column(String(40), default='MIXED')

    progress_records = relationship('Progress', back_populates='user', cascade='all, delete-orphan')
    recommendations = relationship('Recommendation', back_populates='user', cascade='all, delete-orphan')
    sessions = relationship('LearningSession', back_populates='user', cascade='all, delete-orphan')
    subscriptions = relationship('UserSubscription', back_populates='user', cascade='all, delete-orphan')
    course_reviews = relationship('CourseReview', back_populates='user', cascade='all, delete-orphan')
    discussion_posts = relationship('CourseDiscussionPost', back_populates='user', cascade='all, delete-orphan')
