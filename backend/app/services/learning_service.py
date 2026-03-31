from sqlalchemy.orm import Session

from app.learning.engine import generate_daily_plan


def get_learning_path(db: Session, user_id: int) -> dict:
    return generate_daily_plan(db=db, user_id=user_id, limit=20)
