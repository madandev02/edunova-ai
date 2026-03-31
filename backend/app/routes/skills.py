from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.context_service import get_current_user_id
from app.services.skill_service import get_skill_map

router = APIRouter(prefix='/skills', tags=['skills'])


@router.get('')
def get_skills(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict:
    return {
        'skills': get_skill_map(db=db, user_id=user_id),
    }
