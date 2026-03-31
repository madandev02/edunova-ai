from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.review_discussion import (
    ReviewCreateIn,
    ReviewUpdateIn,
    ReviewOut,
    DiscussionPostCreateIn,
    DiscussionPostOut,
    DiscussionThreadOut,
)
from app.services.context_service import get_current_user_id
from app.services.review_service import (
    create_review,
    get_course_reviews,
    get_course_review_stats,
    delete_review,
    update_review,
)
from app.services.discussion_service import (
    create_discussion_post,
    get_course_discussion_threads,
    get_discussion_replies,
    delete_post,
)

router = APIRouter(prefix='/courses', tags=['reviews-discussion'])


@router.post('/{course_id}/reviews', response_model=ReviewOut)
def post_review(
    course_id: int,
    payload: ReviewCreateIn,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> ReviewOut:
    """Create a review for a course."""
    review = create_review(
        db=db,
        course_id=course_id,
        user_id=user_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    return ReviewOut.model_validate(review)


@router.get('/{course_id}/reviews', response_model=dict)
def get_reviews(
    course_id: int,
    sort_by: str = Query(default='recent', pattern='^(recent|rating_high|rating_low)$'),
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> dict:
    """Get reviews for a course."""
    reviews, count = get_course_reviews(
        db=db,
        course_id=course_id,
        sort_by=sort_by,
        limit=limit,
        offset=offset,
    )
    stats = get_course_review_stats(db=db, course_id=course_id)
    return {
        'items': [ReviewOut.model_validate(r) for r in reviews],
        'total': count,
        'stats': stats,
    }


@router.put('/reviews/{review_id}', response_model=ReviewOut)
def update_review_endpoint(
    review_id: int,
    payload: ReviewUpdateIn,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> ReviewOut:
    """Update a review."""
    review = update_review(
        db=db,
        review_id=review_id,
        user_id=user_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    return ReviewOut.model_validate(review)


@router.delete('/reviews/{review_id}')
def delete_review_endpoint(
    review_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Delete a review."""
    delete_review(db=db, review_id=review_id, user_id=user_id)
    return {'status': 'deleted'}


@router.post('/{course_id}/discussions', response_model=DiscussionPostOut)
def post_discussion(
    course_id: int,
    payload: DiscussionPostCreateIn,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> DiscussionPostOut:
    """Create a discussion post or reply."""
    post = create_discussion_post(
        db=db,
        course_id=course_id,
        user_id=user_id,
        body=payload.body,
        kind=payload.kind,
        parent_id=payload.parent_id,
    )
    return DiscussionPostOut.model_validate(post)


@router.get('/{course_id}/discussions', response_model=dict)
def get_discussions(
    course_id: int,
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> dict:
    """Get discussion threads for a course."""
    threads, count = get_course_discussion_threads(
        db=db,
        course_id=course_id,
        limit=limit,
        offset=offset,
    )

    # Enrich threads with replies
    enriched = []
    for thread in threads:
        replies = get_discussion_replies(db=db, parent_id=thread.id)
        enriched.append(
            DiscussionThreadOut(
                id=thread.id,
                course_id=thread.course_id,
                user_id=thread.user_id,
                kind=thread.kind,
                body=thread.body,
                accepted_answer=thread.accepted_answer,
                created_at=thread.created_at,
                replies=[DiscussionPostOut.model_validate(r) for r in replies],
            )
        )

    return {
        'items': enriched,
        'total': count,
    }


@router.post('/discussions/{post_id}/reply', response_model=DiscussionPostOut)
def reply_discussion(
    post_id: int,
    payload: DiscussionPostCreateIn,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> DiscussionPostOut:
    """Reply to a discussion post."""
    parent = db.get(type(payload), post_id)
    if parent is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail='Post not found')

    post = create_discussion_post(
        db=db,
        course_id=parent.course_id,
        user_id=user_id,
        body=payload.body,
        kind='comment' if parent.kind != 'question' else 'answer',
        parent_id=post_id,
    )
    return DiscussionPostOut.model_validate(post)


@router.delete('/discussions/{post_id}')
def delete_discussion(
    post_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Delete a discussion post."""
    delete_post(db=db, post_id=post_id, user_id=user_id)
    return {'status': 'deleted'}
