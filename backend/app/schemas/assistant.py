from pydantic import BaseModel, Field


class AssistantIn(BaseModel):
    message: str = Field(min_length=1)
    course_id: int | None = None


class SourceOut(BaseModel):
    lesson: str
    relevance: float


class AssistantOut(BaseModel):
    reply: str
    context: str | None = None
    sources: list[SourceOut] | None = None
