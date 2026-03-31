from collections.abc import Generator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base, get_db
from app.core.role_middleware import RoleGuardMiddleware
from app.models import (  # noqa: F401
    AssistantEmbedding,
    AttemptEvent,
    Course,
    CourseDiscussionPost,
    CourseReview,
    LearningSession,
    Lesson,
    Module,
    OnboardingProfile,
    Progress,
    Recommendation,
    SkillProfile,
    SubscriptionWebhookEvent,
    TranscriptNote,
    User,
    UserGamification,
    UserSubscription,
)
from app.routes.assistant import router as assistant_router
from app.routes.auth import router as auth_router
from app.routes.courses import router as courses_router
from app.routes.instructor import router as instructor_router
from app.routes.reviews_discussions import router as reviews_discussions_router


@pytest.fixture
def session_factory(tmp_path) -> Generator[sessionmaker, None, None]:
    db_path = tmp_path / "test.db"
    engine = create_engine(
        f"sqlite:///{db_path}",
        connect_args={"check_same_thread": False},
    )
    testing_session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False, class_=Session)

    Base.metadata.create_all(bind=engine)
    try:
        yield testing_session_factory
    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture
def app(session_factory: sessionmaker, monkeypatch: pytest.MonkeyPatch) -> FastAPI:
    application = FastAPI(title="EduNova Test API")

    # Keep middleware behavior in tests, but force it to use the test DB session.
    monkeypatch.setattr("app.core.role_middleware.SessionLocal", session_factory)

    def _get_test_db() -> Generator[Session, None, None]:
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    application.dependency_overrides[get_db] = _get_test_db

    application.add_middleware(RoleGuardMiddleware)
    application.include_router(auth_router)
    application.include_router(courses_router)
    application.include_router(instructor_router)
    application.include_router(reviews_discussions_router)
    application.include_router(assistant_router)

    @application.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return application


@pytest.fixture
def client(app: FastAPI) -> TestClient:
    return TestClient(app)


@pytest.fixture
def db_session(session_factory: sessionmaker) -> Generator[Session, None, None]:
    db = session_factory()
    try:
        yield db
    finally:
        db.close()


def register_user(client: TestClient, email: str, password: str = "Secret123") -> dict:
    response = client.post(
        "/auth/register",
        json={
            "email": email,
            "password": password,
            "level": "BEGINNER",
            "learning_style": "MIXED",
        },
    )
    assert response.status_code == 200, response.text
    return response.json()


def login_user(client: TestClient, email: str, password: str = "Secret123") -> dict:
    response = client.post(
        "/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200, response.text
    return response.json()


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def set_user_role(db: Session, *, email: str, role: str) -> None:
    user = db.query(User).filter(User.email == email).first()
    assert user is not None
    user.role = role
    db.commit()
