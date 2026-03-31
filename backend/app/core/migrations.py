from dataclasses import dataclass

from sqlalchemy import text
from sqlalchemy.engine import Engine


@dataclass(frozen=True)
class SchemaMigration:
    version: str
    description: str
    statements: tuple[str, ...]


MIGRATIONS: tuple[SchemaMigration, ...] = (
    SchemaMigration(
        version='20260329_01_lessons_video_fields',
        description='Add video_url and video_duration_seconds to lessons.',
        statements=(
            'ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_url TEXT',
            'ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_duration_seconds INTEGER',
        ),
    ),
    SchemaMigration(
        version='20260329_02_learning_sessions_video_progress',
        description='Add lesson video progress fields to learning_sessions.',
        statements=(
            'ALTER TABLE learning_sessions ADD COLUMN IF NOT EXISTS lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE',
            'ALTER TABLE learning_sessions ADD COLUMN IF NOT EXISTS playback_seconds INTEGER DEFAULT 0',
            "ALTER TABLE learning_sessions ADD COLUMN IF NOT EXISTS watched_sections_json TEXT DEFAULT '[]'",
            'ALTER TABLE learning_sessions ADD COLUMN IF NOT EXISTS completion_ratio DOUBLE PRECISION DEFAULT 0',
            'ALTER TABLE learning_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_lesson ON learning_sessions(user_id, lesson_id)',
        ),
    ),
    SchemaMigration(
        version='20260329_03_seed_metadata',
        description='Create seed metadata table for catalog version tracking.',
        statements=(
            '''
            CREATE TABLE IF NOT EXISTS seed_metadata (
                key VARCHAR(120) PRIMARY KEY,
                value VARCHAR(200) NOT NULL,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            ''',
        ),
    ),
    SchemaMigration(
        version='20260329_04_transcript_notes',
        description='Create transcript notes table for per-user lesson highlights/notes.',
        statements=(
            '''
            CREATE TABLE IF NOT EXISTS transcript_notes (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
                segment_id VARCHAR(80) NOT NULL,
                highlight_text TEXT,
                note_text TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            ''',
            'CREATE UNIQUE INDEX IF NOT EXISTS uq_transcript_note_user_lesson_segment ON transcript_notes(user_id, lesson_id, segment_id)',
            'CREATE INDEX IF NOT EXISTS idx_transcript_notes_user_lesson ON transcript_notes(user_id, lesson_id)',
        ),
    ),
    SchemaMigration(
        version='20260329_05_recommendation_decay_rule',
        description='Add decay rule metadata to recommendations.',
        statements=(
            "ALTER TABLE recommendations ADD COLUMN IF NOT EXISTS decay_rule VARCHAR(48) DEFAULT 'none'",
        ),
    ),
    SchemaMigration(
        version='20260330_01_course_premium_and_subscription',
        description='Add premium flags to courses and create user_subscriptions table.',
        statements=(
            'ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE',
            '''
            CREATE TABLE IF NOT EXISTS user_subscriptions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                plan VARCHAR(32) NOT NULL DEFAULT 'free',
                status VARCHAR(32) NOT NULL DEFAULT 'inactive',
                stripe_customer_id VARCHAR(120)
            )
            ''',
            'CREATE INDEX IF NOT EXISTS idx_user_subscriptions_customer_id ON user_subscriptions(stripe_customer_id)',
        ),
    ),
    SchemaMigration(
        version='20260330_02_subscription_webhook_events',
        description='Create subscription webhook event audit table.',
        statements=(
            '''
            CREATE TABLE IF NOT EXISTS subscription_webhook_events (
                id SERIAL PRIMARY KEY,
                stripe_event_id VARCHAR(120),
                event_type VARCHAR(120) NOT NULL,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                status VARCHAR(24) NOT NULL DEFAULT 'received',
                error_message TEXT,
                payload_json TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            ''',
            'CREATE INDEX IF NOT EXISTS idx_subscription_webhook_events_event_type ON subscription_webhook_events(event_type)',
            'CREATE INDEX IF NOT EXISTS idx_subscription_webhook_events_user_id ON subscription_webhook_events(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_subscription_webhook_events_stripe_event_id ON subscription_webhook_events(stripe_event_id)',
        ),
    ),
    SchemaMigration(
        version='20260330_03_rbac_and_learning_community',
        description='Add RBAC role plus review/discussion/embedding tables.',
        statements=(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(24) DEFAULT 'student'",
            'ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail_url TEXT',
            'ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_id INTEGER REFERENCES users(id) ON DELETE SET NULL',
            '''
            CREATE TABLE IF NOT EXISTS course_reviews (
                id SERIAL PRIMARY KEY,
                course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                rating INTEGER NOT NULL,
                comment TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            ''',
            'CREATE INDEX IF NOT EXISTS idx_course_reviews_course_id ON course_reviews(course_id)',
            'CREATE INDEX IF NOT EXISTS idx_course_reviews_user_id ON course_reviews(user_id)',
            '''
            CREATE TABLE IF NOT EXISTS course_discussion_posts (
                id SERIAL PRIMARY KEY,
                course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                parent_id INTEGER REFERENCES course_discussion_posts(id) ON DELETE CASCADE,
                kind VARCHAR(16) NOT NULL DEFAULT 'question',
                body TEXT NOT NULL,
                accepted_answer BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            ''',
            'CREATE INDEX IF NOT EXISTS idx_course_discussion_course_id ON course_discussion_posts(course_id)',
            'CREATE INDEX IF NOT EXISTS idx_course_discussion_parent_id ON course_discussion_posts(parent_id)',
            '''
            CREATE TABLE IF NOT EXISTS assistant_embeddings (
                id SERIAL PRIMARY KEY,
                entity_type VARCHAR(32) NOT NULL,
                entity_id INTEGER NOT NULL,
                chunk_text TEXT NOT NULL,
                metadata_json TEXT NOT NULL,
                vector_json TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            ''',
            'CREATE INDEX IF NOT EXISTS idx_assistant_embeddings_entity_type ON assistant_embeddings(entity_type)',
            'CREATE INDEX IF NOT EXISTS idx_assistant_embeddings_entity_id ON assistant_embeddings(entity_id)',
        ),
    ),
    SchemaMigration(
        version='20260330_04_billing_hardening',
        description='Add payment timestamp and enforce webhook idempotency key uniqueness.',
        statements=(
            'ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMP',
            'CREATE UNIQUE INDEX IF NOT EXISTS uq_subscription_webhook_events_stripe_event_id ON subscription_webhook_events(stripe_event_id)',
        ),
    ),
)


def apply_schema_migrations(engine: Engine) -> None:
    with engine.begin() as connection:
        connection.execute(
            text(
                '''
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    version VARCHAR(120) PRIMARY KEY,
                    description TEXT NOT NULL,
                    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                '''
            )
        )

        existing_rows = connection.execute(text('SELECT version FROM schema_migrations')).all()
        applied_versions = {str(row[0]) for row in existing_rows}

        for migration in MIGRATIONS:
            if migration.version in applied_versions:
                continue

            for statement in migration.statements:
                connection.execute(text(statement))

            connection.execute(
                text(
                    '''
                    INSERT INTO schema_migrations (version, description)
                    VALUES (:version, :description)
                    '''
                ),
                {'version': migration.version, 'description': migration.description},
            )