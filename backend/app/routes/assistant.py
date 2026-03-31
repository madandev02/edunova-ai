from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.assistant.service import build_assistant_reply
from app.core.database import get_db
from app.schemas.assistant import AssistantIn, AssistantOut
from app.services.context_service import get_current_user_id
from app.services.embedding_service import embed_course_content
from app.models.user import User

router = APIRouter(prefix='/assistant', tags=['assistant'])


@router.post('/chat', response_model=AssistantOut)
def assistant_chat(
    payload: AssistantIn,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> AssistantOut:
    return AssistantOut.model_validate(
        build_assistant_reply(db=db, user_id=user_id, message=payload.message, course_id=payload.course_id)
    )


@router.post('/courses/{course_id}/embed')
def embed_course(
    course_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict:
    """Embed all lesson content in a course (instructor-only)."""
    user = db.get(User, user_id)
    if user is None or user.role != 'instructor':
        raise HTTPException(status_code=403, detail='Instructor role required')

    count = embed_course_content(db=db, course_id=course_id)
    return {'status': 'embedded', 'chunk_count': count}
