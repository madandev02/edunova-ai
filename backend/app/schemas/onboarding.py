from typing import Literal

from pydantic import BaseModel, Field


class AssessmentAnswerIn(BaseModel):
    question_id: str = Field(min_length=1)
    difficulty: Literal['FOUNDATIONAL', 'INTERMEDIATE', 'ADVANCED']
    correct: bool


class OnboardingIn(BaseModel):
    goal: str = Field(min_length=3)
    interests: list[str] = Field(default_factory=list)
    experience_level: str
    assessment_answers: list[bool | AssessmentAnswerIn] | None = None


class OnboardingStatusOut(BaseModel):
    completed: bool
    level: str | None = None
    first_course_id: int | None = None


class OnboardingOut(BaseModel):
    level: str
    assessment_score: float | None = None
    first_course_id: int | None = None
    first_course_title: str | None = None
    generated_learning_path_lesson_ids: list[int]
    rationale: str | None = None
