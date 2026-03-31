from fastapi import HTTPException
from sqlalchemy import func, select, desc
from sqlalchemy.orm import Session

from app.models.course_discussion_post import CourseDiscussionPost


def create_discussion_post(
    db: Session,
    course_id: int,
    user_id: int,
    body: str,
    kind: str = 'question',
    parent_id: int | None = None,
) -> CourseDiscussionPost:
    """Create a discussion post or reply."""
    if kind not in {'question', 'answer', 'comment'}:
        raise HTTPException(status_code=400, detail='Invalid kind: must be question, answer, or comment')

    post = CourseDiscussionPost(
        course_id=course_id,
        user_id=user_id,
        body=body,
        kind=kind,
        parent_id=parent_id,
        accepted_answer=False,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


def get_course_discussion_threads(
    db: Session,
    course_id: int,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[CourseDiscussionPost], int]:
    """Get top-level discussion posts (threads) for a course, ordered by recency."""
    query = select(CourseDiscussionPost).where(
        CourseDiscussionPost.course_id == course_id,
        CourseDiscussionPost.parent_id.is_(None),
    )

    count = db.scalar(
        select(func.count(CourseDiscussionPost.id)).where(
            CourseDiscussionPost.course_id == course_id,
            CourseDiscussionPost.parent_id.is_(None),
        )
    ) or 0

    threads = db.scalars(
        query.order_by(desc(CourseDiscussionPost.created_at)).limit(limit).offset(offset)
    ).all()

    return threads, count


def get_discussion_replies(
    db: Session,
    parent_id: int,
) -> list[CourseDiscussionPost]:
    """Get all replies to a discussion post."""
    return db.scalars(
        select(CourseDiscussionPost)
        .where(CourseDiscussionPost.parent_id == parent_id)
        .order_by(CourseDiscussionPost.created_at)
    ).all()


def mark_answer_accepted(
    db: Session,
    post_id: int,
    instructor_id: int,
    course_id: int,
) -> CourseDiscussionPost:
    """Mark a post as accepted answer (instructor only)."""
    post = db.get(CourseDiscussionPost, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail='Post not found')

    if post.course_id != course_id:
        raise HTTPException(status_code=404, detail='Post not in this course')

    # Check that instructor owns the course
    course = db.get(type(post).__table__.c.course_id, course_id)
    if course is None or course.instructor_id != instructor_id:
        raise HTTPException(status_code=403, detail='Only course instructor can mark answers')

    post.accepted_answer = True
    db.commit()
    db.refresh(post)
    return post


def unmark_answer_accepted(
    db: Session,
    post_id: int,
    instructor_id: int,
    course_id: int,
) -> CourseDiscussionPost:
    """Unmark a post as accepted answer (instructor only)."""
    post = db.get(CourseDiscussionPost, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail='Post not found')

    if post.course_id != course_id:
        raise HTTPException(status_code=404, detail='Post not in this course')

    # Check that instructor owns the course
    course = db.get(type(post).__table__.c.course_id, course_id)
    if course is None or course.instructor_id != instructor_id:
        raise HTTPException(status_code=403, detail='Only course instructor can mark answers')

    post.accepted_answer = False
    db.commit()
    db.refresh(post)
    return post


def delete_post(
    db: Session,
    post_id: int,
    user_id: int,
) -> None:
    """Delete a post if user is the author."""
    post = db.get(CourseDiscussionPost, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail='Post not found')

    if post.user_id != user_id:
        raise HTTPException(status_code=403, detail='Cannot delete another user\'s post')

    db.delete(post)
    db.commit()
