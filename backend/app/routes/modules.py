from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.course import ModuleOut
from app.services.context_service import get_current_user_id
from app.services.course_service import list_modules

router = APIRouter(prefix='/modules', tags=['modules'])


@router.get('', response_model=list[ModuleOut])
def get_modules(
    course_id: int | None = Query(default=None),
    _: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> list[ModuleOut]:
    return [ModuleOut.model_validate(module) for module in list_modules(db=db, course_id=course_id)]
