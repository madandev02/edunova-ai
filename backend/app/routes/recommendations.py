from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.recommendation import RecommendationEngineOut
from app.services.context_service import get_current_user_id
from app.services.recommendation_service import get_recommendations_for_user, refresh_recommendations

router = APIRouter(prefix='/recommendations', tags=['recommendations'])


@router.get('', response_model=list[RecommendationEngineOut])
def get_recommendations(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[RecommendationEngineOut]:
    items = get_recommendations_for_user(db=db, user_id=user_id)
    return [
        RecommendationEngineOut(
            lesson_id=item['lesson_id'],
            priority=item['priority'],
            decay_rule=item.get('decay_rule', 'none'),
            reason=item['reason'],
        )
        for item in items
    ]


@router.post('/refresh', response_model=list[RecommendationEngineOut])
def refresh(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[RecommendationEngineOut]:
    records = refresh_recommendations(db=db, user_id=user_id)
    return [
        RecommendationEngineOut(
            lesson_id=item.lesson_id,
            priority=item.priority,
            decay_rule=item.decay_rule,
            reason=item.reason,
        )
        for item in records
    ]
