from pydantic import BaseModel


class LearningPathItemOut(BaseModel):
    id: int
    title: str
    difficulty: str
    status: str
    priority: str
    order: int
    reason: str
    depends_on_lesson_id: int | None = None


class LearningPathOut(BaseModel):
    items: list[LearningPathItemOut]
    current_lesson_id: int | None = None
