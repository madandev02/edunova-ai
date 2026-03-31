from collections.abc import Awaitable, Callable

from fastapi import HTTPException
from jose import JWTError, jwt
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.core.config import get_settings
from app.core.database import SessionLocal
from app.models.user import User


class RoleGuardMiddleware(BaseHTTPMiddleware):
    """Lightweight API-level role gate for sensitive route groups."""

    role_rules: tuple[tuple[str, set[str]], ...] = (
        ('/billing/webhook-events', {'admin'}),
        ('/instructor', {'instructor'}),
    )

    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        if request.method == 'OPTIONS':
            return await call_next(request)

        required_roles = self._required_roles_for_path(request.url.path)
        if required_roles is None:
            return await call_next(request)

        try:
            user = self._resolve_user_from_token(request)
            user_role = (user.role or '').lower()
            if user_role not in required_roles:
                raise HTTPException(status_code=403, detail='Insufficient role for this operation')
        except HTTPException as error:
            return JSONResponse(status_code=error.status_code, content={'detail': error.detail})

        return await call_next(request)

    def _required_roles_for_path(self, path: str) -> set[str] | None:
        for prefix, roles in self.role_rules:
            if path == prefix or path.startswith(f'{prefix}/'):
                return roles
        return None

    def _resolve_user_from_token(self, request: Request) -> User:
        settings = get_settings()
        auth_header = request.headers.get('authorization') or ''
        if not auth_header.lower().startswith('bearer '):
            raise HTTPException(status_code=401, detail='Missing authentication token')

        token = auth_header.split(' ', 1)[1].strip()
        try:
            payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
            subject = payload.get('sub')
        except JWTError as error:
            raise HTTPException(status_code=401, detail='Invalid token') from error

        if subject is None or not str(subject).isdigit():
            raise HTTPException(status_code=401, detail='Invalid token subject')

        db = SessionLocal()
        try:
            user = db.get(User, int(subject))
            if user is None:
                raise HTTPException(status_code=401, detail='User not found')
            return user
        finally:
            db.close()
