from fastapi import HTTPException
from sqlalchemy import func, select, desc
from sqlalchemy.orm import Session

from app.models.course_review import CourseReview


def create_review(
    db: Session,
    course_id: int,
    user_id: int,
    rating: int,
    comment: str,
) -> CourseReview:
    """Create a review for a course."""
    if not 1 <= rating <= 5:
        raise HTTPException(status_code=400, detail='Rating must be between 1 and 5')

    review = CourseReview(
        course_id=course_id,
        user_id=user_id,
        rating=rating,
        comment=comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


def get_course_reviews(
    db: Session,
    course_id: int,
    sort_by: str = 'recent',
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[CourseReview], int]:
    """Get reviews for a course, sorted and paginated."""
    query = select(CourseReview).where(CourseReview.course_id == course_id)

    if sort_by == 'rating_high':
        query = query.order_by(desc(CourseReview.rating))
    elif sort_by == 'rating_low':
        query = query.order_by(CourseReview.rating)
    else:  # recent
        query = query.order_by(desc(CourseReview.created_at))

    count = db.scalar(
        select(func.count(CourseReview.id)).where(CourseReview.course_id == course_id)
    ) or 0

    reviews = db.scalars(query.limit(limit).offset(offset)).all()
    return reviews, count


def get_course_review_stats(db: Session, course_id: int) -> dict:
    """Get aggregate review stats for a course."""
    result = db.execute(
        select(
            func.count(CourseReview.id).label('total'),
            func.avg(CourseReview.rating).label('avg_rating'),
        ).where(CourseReview.course_id == course_id)
    ).first()

    if result is None or result[0] == 0:
        return {'total_reviews': 0, 'average_rating': 0.0}

    return {
        'total_reviews': int(result[0] or 0),
        'average_rating': float(result[1] or 0.0),
    }


def delete_review(db: Session, review_id: int, user_id: int) -> None:
    """Delete review if user is the author."""
    review = db.get(CourseReview, review_id)
    if review is None:
        raise HTTPException(status_code=404, detail='Review not found')

    if review.user_id != user_id:
        raise HTTPException(status_code=403, detail='Cannot delete another user\'s review')

    db.delete(review)
    db.commit()


def update_review(
    db: Session,
    review_id: int,
    user_id: int,
    rating: int | None = None,
    comment: str | None = None,
) -> CourseReview:
    """Update review if user is the author."""
    review = db.get(CourseReview, review_id)
    if review is None:
        raise HTTPException(status_code=404, detail='Review not found')

    if review.user_id != user_id:
        raise HTTPException(status_code=403, detail='Cannot edit another user\'s review')

    if rating is not None:
        if not 1 <= rating <= 5:
            raise HTTPException(status_code=400, detail='Rating must be between 1 and 5')
        review.rating = rating

    if comment is not None:
        review.comment = comment

    db.commit()
    db.refresh(review)
    return review
