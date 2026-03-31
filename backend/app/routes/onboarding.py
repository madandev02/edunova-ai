from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.onboarding import OnboardingIn, OnboardingOut, OnboardingStatusOut
from app.services.context_service import get_current_user_id
from app.services.onboarding_service import complete_onboarding, get_onboarding_status

router = APIRouter(prefix='/onboarding', tags=['onboarding'])


@router.get('/status', response_model=OnboardingStatusOut)
def status(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> OnboardingStatusOut:
    return OnboardingStatusOut.model_validate(get_onboarding_status(db=db, user_id=user_id))


@router.post('/complete', response_model=OnboardingOut)
def complete(
    payload: OnboardingIn,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> OnboardingOut:
    return OnboardingOut.model_validate(complete_onboarding(db=db, user_id=user_id, payload=payload))
