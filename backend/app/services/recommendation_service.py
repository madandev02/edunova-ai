from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload

from app.models.course import Lesson
from app.models.recommendation import Recommendation
from app.recommender.engine import build_recommendations


def refresh_recommendations(db: Session, user_id: int) -> list[Recommendation]:
    candidates = build_recommendations(db=db, user_id=user_id)

    db.execute(delete(Recommendation).where(Recommendation.user_id == user_id))
    records: list[Recommendation] = []

    for item in candidates:
        record = Recommendation(
            user_id=user_id,
            lesson_id=item['lesson_id'],
            priority=item['priority'],
            decay_rule=item.get('decay_rule', 'none'),
            reason=item['reason'],
        )
        db.add(record)
        records.append(record)

    db.commit()
    for record in records:
        db.refresh(record)

    return records


def list_recommendations(db: Session, user_id: int) -> list[Recommendation]:
    return db.scalars(
        select(Recommendation)
        .where(Recommendation.user_id == user_id)
        .options(selectinload(Recommendation.lesson).selectinload(Lesson.module))
        .order_by(Recommendation.id.desc())
    ).all()


def get_recommendations_for_user(db: Session, user_id: int) -> list[dict]:
    records = list_recommendations(db=db, user_id=user_id)
    if not records:
        records = refresh_recommendations(db=db, user_id=user_id)
        records = list_recommendations(db=db, user_id=user_id)

    output = []
    for record in records:
        topic = record.lesson.title if record.lesson else f'Lesson {record.lesson_id}'
        output.append(
            {
                'id': str(record.id),
                'topic': topic,
                'priority': record.priority,
                'decay_rule': record.decay_rule or 'none',
                'reason': record.reason,
                'lesson_id': record.lesson_id,
            }
        )
    return output
