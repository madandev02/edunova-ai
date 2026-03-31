from pydantic import BaseModel
from datetime import datetime


class ReviewCreateIn(BaseModel):
    rating: int
    comment: str


class ReviewUpdateIn(BaseModel):
    rating: int | None = None
    comment: str | None = None


class ReviewOut(BaseModel):
    id: int
    course_id: int
    user_id: int
    rating: int
    comment: str
    created_at: datetime

    model_config = {'from_attributes': True}


class ReviewStatsOut(BaseModel):
    total_reviews: int
    average_rating: float


class DiscussionPostCreateIn(BaseModel):
    body: str
    kind: str = 'question'
    parent_id: int | None = None


class DiscussionPostOut(BaseModel):
    id: int
    course_id: int
    user_id: int
    parent_id: int | None = None
    kind: str
    body: str
    accepted_answer: bool
    created_at: datetime

    model_config = {'from_attributes': True}


class DiscussionThreadOut(BaseModel):
    id: int
    course_id: int
    user_id: int
    kind: str
    body: str
    accepted_answer: bool
    created_at: datetime
    replies: list['DiscussionPostOut'] = []

    model_config = {'from_attributes': True}
