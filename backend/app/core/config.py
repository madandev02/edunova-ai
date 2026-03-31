from functools import lru_cache

from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = ConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    app_name: str = 'EduNova AI Backend'
    app_version: str = '1.0.0'
    debug: bool = False
    api_prefix: str = '/api'
    # Docker-friendly default: hostname must be db, never localhost in containers.
    database_url: str = 'postgresql+psycopg://postgres:postgres@db:5432/edunova'
    secret_key: str = 'replace-this-with-a-strong-random-secret'
    jwt_algorithm: str = 'HS256'
    access_token_expire_minutes: int = 60 * 24
    cors_origins: str = 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000'
    frontend_url: str = 'http://localhost:3000'
    stripe_secret_key: str = ''
    stripe_webhook_secret: str = ''
    stripe_price_id_pro: str = ''
    stripe_price_id_premium: str = ''
    admin_emails: str = 'admin@test.com,demo@edunova.ai'

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip().rstrip('/') for origin in self.cors_origins.split(',') if origin.strip()]

    @property
    def cors_allow_credentials(self) -> bool:
        # Wildcard origins are incompatible with credentialed CORS.
        return '*' not in self.cors_origins_list

    @property
    def admin_emails_list(self) -> list[str]:
        return [email.strip().lower() for email in self.admin_emails.split(',') if email.strip()]


@lru_cache

def get_settings() -> Settings:
    return Settings()
