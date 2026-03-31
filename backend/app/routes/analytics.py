from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.analytics.service import build_analytics, build_dashboard
from app.core.database import get_db
from app.services.context_service import get_current_user_id

router = APIRouter(tags=['analytics'])


@router.get('/analytics')
def analytics(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict:
    data = build_analytics(db=db, user_id=user_id)
    return {
        'overallProgress': data['overall_progress'],
        'successRate': data['success_rate'],
        'weakAreas': data['weak_areas'],
        'performanceOverTime': data['performance_over_time'],
        'successRateByTopic': data['success_rate_by_topic'],
        'attemptsPerTopic': data['attempts_per_topic'],
    }


@router.get('/dashboard')
def dashboard(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict:
    return build_dashboard(db=db, user_id=user_id)
