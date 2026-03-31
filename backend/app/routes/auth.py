from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.auth import LoginIn, RegisterIn, TokenOut, UserAuthOut
from app.services.auth_service import get_user_by_id, login_user, register_user
from app.services.context_service import get_current_user_id

router = APIRouter(prefix='/auth', tags=['auth'])


@router.post('/register', response_model=TokenOut)
def register(payload: RegisterIn, db: Session = Depends(get_db)) -> TokenOut:
    return register_user(db=db, payload=payload)


@router.post('/login', response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)) -> TokenOut:
    return login_user(db=db, payload=payload)


@router.get('/me', response_model=UserAuthOut)
def me(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)) -> UserAuthOut:
    user = get_user_by_id(db=db, user_id=user_id)
    if user is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail='User not found')

    return UserAuthOut(
        id=user.id,
        email=user.email,
        role=user.role or 'student',
        level=user.level,
        learning_style=user.learning_style,
    )
