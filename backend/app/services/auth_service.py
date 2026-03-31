from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.schemas.auth import LoginIn, RegisterIn, TokenOut, UserAuthOut


def _build_token_response(user: User) -> TokenOut:
    token = create_access_token(subject=str(user.id))
    return TokenOut(
        access_token=token,
        token_type='bearer',
        user=UserAuthOut(
            id=user.id,
            email=user.email,
            role=user.role or 'student',
            level=user.level,
            learning_style=user.learning_style,
        ),
    )


def register_user(db: Session, payload: RegisterIn) -> TokenOut:
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing is not None:
        raise HTTPException(status_code=409, detail='Email already registered')

    user = User(
        email=str(payload.email),
        hashed_password=get_password_hash(payload.password),
        level=payload.level.upper(),
        learning_style=payload.learning_style.upper(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return _build_token_response(user)


def login_user(db: Session, payload: LoginIn) -> TokenOut:
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail='Invalid email or password')

    return _build_token_response(user)


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.scalar(select(User).where(User.id == user_id))
