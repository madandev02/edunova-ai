from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.context_service import get_current_user_id
from app.services.learning_service import get_learning_path

router = APIRouter(prefix='/learning-path', tags=['learning-path'])


@router.get('')
def learning_path(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict:
    data = get_learning_path(db=db, user_id=user_id)

    return {
        'items': [
            {
                **item,
                'dependsOnLessonId': item['depends_on_lesson_id'],
            }
            for item in data['items']
        ],
        'currentLessonId': data['current_lesson_id'],
    }
