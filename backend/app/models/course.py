from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Course(Base):
    __tablename__ = 'courses'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(180), index=True)
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(60), default='General', index=True)
    difficulty: Mapped[str] = mapped_column(String(24), default='beginner', index=True)
    is_premium: Mapped[bool] = mapped_column(default=False)
    thumbnail_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    instructor_id: Mapped[int | None] = mapped_column(ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)

    modules = relationship('Module', back_populates='course', cascade='all, delete-orphan')
    reviews = relationship('CourseReview', back_populates='course', cascade='all, delete-orphan')
    discussion_posts = relationship('CourseDiscussionPost', back_populates='course', cascade='all, delete-orphan')


class Module(Base):
    __tablename__ = 'modules'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(180), index=True)
    course_id: Mapped[int] = mapped_column(ForeignKey('courses.id', ondelete='CASCADE'))

    course = relationship('Course', back_populates='modules')
    lessons = relationship('Lesson', back_populates='module', cascade='all, delete-orphan')


class Lesson(Base):
    __tablename__ = 'lessons'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(180), index=True)
    content: Mapped[str] = mapped_column(Text)
    difficulty: Mapped[str] = mapped_column(String(24), default='medium')
    module_id: Mapped[int] = mapped_column(ForeignKey('modules.id', ondelete='CASCADE'))
    order_index: Mapped[int] = mapped_column(Integer, default=1)
    quiz_question: Mapped[str | None] = mapped_column(Text, nullable=True)
    quiz_options: Mapped[str | None] = mapped_column(Text, nullable=True)
    correct_answer: Mapped[str | None] = mapped_column(String(200), nullable=True)
    video_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    video_duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)

    module = relationship('Module', back_populates='lessons')
    progress_records = relationship('Progress', back_populates='lesson', cascade='all, delete-orphan')
    recommendations = relationship('Recommendation', back_populates='lesson', cascade='all, delete-orphan')
