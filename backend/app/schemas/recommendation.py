from pydantic import BaseModel


class RecommendationOut(BaseModel):
    id: int
    user_id: int
    lesson_id: int
    priority: str
    decay_rule: str = 'none'
    reason: str

    model_config = {'from_attributes': True}


class RecommendationEngineOut(BaseModel):
    lesson_id: int
    priority: str
    decay_rule: str = 'none'
    reason: str
