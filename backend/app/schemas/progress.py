from datetime import datetime

from pydantic import BaseModel, Field


class ProgressOut(BaseModel):
    id: int
    user_id: int
    lesson_id: int
    score: float
    attempts: int
    completed: bool
    updated_at: datetime

    model_config = {'from_attributes': True}


class LessonSubmitIn(BaseModel):
    answer: str = Field(min_length=1)
    time_spent_seconds: int = Field(default=0, ge=0, le=7200)


class LessonSubmitOut(BaseModel):
    score: float
    feedback: str
    recommendationImpact: str | None = None
    xpGained: int | None = None
    streakDays: int | None = None


class ProgressCompleteOut(BaseModel):
    lesson_id: int
    completed: bool


class VideoProgressIn(BaseModel):
    playback_seconds: int = Field(default=0, ge=0, le=14400)
    completed_section_ids: list[str] = Field(default_factory=list)
    video_duration_seconds: int | None = Field(default=None, ge=0, le=14400)


class VideoProgressOut(BaseModel):
    lesson_id: int
    playback_seconds: int
    completed_section_ids: list[str]
    completion_ratio: float


class TranscriptNoteIn(BaseModel):
    segment_id: str = Field(min_length=1)
    highlight_text: str | None = None
    note_text: str | None = None


class TranscriptNotesUpsertIn(BaseModel):
    notes: list[TranscriptNoteIn] = Field(default_factory=list)


class TranscriptNoteOut(BaseModel):
    id: int
    lesson_id: int
    segment_id: str
    highlight_text: str | None = None
    note_text: str | None = None


class ResumeLessonOut(BaseModel):
    lesson_id: int
    lesson_title: str
    course_id: int | None = None
    course_title: str | None = None
    playback_seconds: int
    completion_ratio: float
