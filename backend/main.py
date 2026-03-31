from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import Base, SessionLocal, engine
from app.core.migrations import apply_schema_migrations
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
    UserSubscription,
    UserGamification,
)
from app.routes.analytics import router as analytics_router
from app.routes.assistant import router as assistant_router
from app.routes.auth import router as auth_router
from app.routes.billing import router as billing_router
from app.routes.courses import router as courses_router
from app.routes.content_audit import router as content_audit_router
from app.routes.instructor import router as instructor_router
from app.routes.learning_path import router as learning_path_router
from app.routes.lessons import router as lessons_router
from app.routes.modules import router as modules_router
from app.routes.onboarding import router as onboarding_router
from app.routes.progress import router as progress_router
from app.routes.public import router as public_router
from app.routes.recommendations import router as recommendations_router
from app.routes.reviews_discussions import router as reviews_discussions_router
from app.routes.root import router as root_router
from app.routes.skills import router as skills_router
from app.services.content_audit_service import build_content_alignment_report
from app.services.seed_service import seed_if_empty

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    apply_schema_migrations(engine=engine)

    db = SessionLocal()
    try:
        seed_if_empty(db=db)
        app.state.content_audit_report = build_content_alignment_report(db=db)
    finally:
        db.close()

    yield


app = FastAPI(title=settings.app_name, version=settings.app_version, debug=settings.debug, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=['*'],
    allow_headers=['*'],
)
app.add_middleware(RoleGuardMiddleware)

app.include_router(auth_router)
app.include_router(public_router)
app.include_router(billing_router)
app.include_router(onboarding_router)
app.include_router(courses_router)
app.include_router(instructor_router)
app.include_router(content_audit_router)
app.include_router(modules_router)
app.include_router(lessons_router)
app.include_router(progress_router)
app.include_router(reviews_discussions_router)
app.include_router(skills_router)
app.include_router(recommendations_router)
app.include_router(analytics_router)
app.include_router(learning_path_router)
app.include_router(assistant_router)
app.include_router(root_router)


@app.get('/health')
def health() -> dict:
    return {'status': 'ok'}
