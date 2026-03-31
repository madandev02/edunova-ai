from jose import JWTError, jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> int:
    if credentials is None:
        raise HTTPException(status_code=401, detail='Missing authentication token')

    settings = get_settings()
    token = credentials.credentials

    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        subject = payload.get('sub')
    except JWTError as error:
        raise HTTPException(status_code=401, detail='Invalid token') from error

    if subject is None or not str(subject).isdigit():
        raise HTTPException(status_code=401, detail='Invalid token subject')

    return int(subject)


def get_current_admin_user_id(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> int:
    settings = get_settings()
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail='User not found')

    is_role_admin = (user.role or '').lower() == 'admin'
    is_legacy_email_admin = user.email.lower() in settings.admin_emails_list

    if not is_role_admin and not is_legacy_email_admin:
        raise HTTPException(status_code=403, detail='Admin access required')

    return user_id


def get_current_instructor_user_id(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> int:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail='User not found')

    if (user.role or '').lower() != 'instructor':
        raise HTTPException(status_code=403, detail='Instructor role required')

    return user_id


def require_roles(
    roles: set[str],
):
    def _enforcer(
        user_id: int = Depends(get_current_user_id),
        db: Session = Depends(get_db),
    ) -> int:
        user = db.get(User, user_id)
        if user is None:
            raise HTTPException(status_code=401, detail='User not found')

        if (user.role or '').lower() not in {item.lower() for item in roles}:
            raise HTTPException(status_code=403, detail='Insufficient role for this operation')

        return user_id

    return _enforcer
