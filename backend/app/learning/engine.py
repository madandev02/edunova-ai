from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.course import Lesson
from app.models.progress import Progress
from app.recommender.engine import build_recommendations

PRIORITY_RANK = {'HIGH': 3, 'MEDIUM': 2, 'LOW': 1}


def generate_daily_plan(db: Session, user_id: int, limit: int = 6) -> dict:
    lessons = db.scalars(select(Lesson).order_by(Lesson.module_id.asc(), Lesson.order_index.asc())).all()
    progress_rows = db.scalars(select(Progress).where(Progress.user_id == user_id)).all()
    progress_by_lesson = {row.lesson_id: row for row in progress_rows}

    recommendation_map = {
        item['lesson_id']: item for item in build_recommendations(db=db, user_id=user_id)
    }

    items: list[dict] = []
    previous_completed_by_module: dict[int, bool] = {}

    for lesson in lessons:
        progress = progress_by_lesson.get(lesson.id)
        if progress and progress.completed:
            status = 'completed'
            previous_completed_by_module[lesson.module_id] = True
        elif progress and progress.attempts > 0:
            status = 'in_progress'
            previous_completed_by_module[lesson.module_id] = False
        else:
            module_has_previous = lesson.order_index > 1
            previous_done = previous_completed_by_module.get(lesson.module_id, True)
            status = 'locked' if (module_has_previous and not previous_done) else 'in_progress'
            previous_completed_by_module[lesson.module_id] = False

        recommendation = recommendation_map.get(lesson.id)
        priority = recommendation['priority'] if recommendation else ('MEDIUM' if status != 'completed' else 'LOW')
        dependency = db.scalar(
            select(Lesson)
            .where(
                Lesson.module_id == lesson.module_id,
                Lesson.order_index == lesson.order_index - 1,
            )
        )

        if recommendation:
            reason = recommendation['reason']
        elif status == 'in_progress':
            reason = 'Continue this lesson to unlock personalized recommendations.'
        elif status == 'locked':
            reason = 'Complete the prerequisite lesson to unlock this step.'
        else:
            reason = 'Already completed. Keep this as review material.'

        items.append(
            {
                'id': lesson.id,
                'title': lesson.title,
                'difficulty': lesson.difficulty,
                'status': status,
                'priority': priority,
                'order': lesson.order_index,
                'reason': reason,
                'depends_on_lesson_id': dependency.id if dependency else None,
            }
        )

    sorted_items = sorted(
        items,
        key=lambda item: (item['status'] == 'locked', -PRIORITY_RANK[item['priority']], item['order']),
    )

    current = next((item['id'] for item in sorted_items if item['status'] == 'in_progress'), None)

    return {
        'items': sorted_items[:limit],
        'current_lesson_id': current,
    }
