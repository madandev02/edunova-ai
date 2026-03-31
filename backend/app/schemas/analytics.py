from pydantic import BaseModel


class WeakAreaOut(BaseModel):
    topic: str
    score: float


class ProgressSnapshotOut(BaseModel):
    percentage: float
    current_level: str


class RecentActivityOut(BaseModel):
    id: str
    topic: str
    score: float
    attempted_at: str


class DashboardOut(BaseModel):
    progress: ProgressSnapshotOut
    weak_areas: list[WeakAreaOut]
    recommendations: list[dict]
    recent_activity: list[RecentActivityOut]


class PerformancePoint(BaseModel):
    date: str
    score: float


class SuccessRatePoint(BaseModel):
    topic: str
    rate: float


class AttemptsPoint(BaseModel):
    topic: str
    attempts: int


class AnalyticsOut(BaseModel):
    overall_progress: float
    success_rate: float
    weak_areas: list[WeakAreaOut]
    performance_over_time: list[PerformancePoint]
    success_rate_by_topic: list[SuccessRatePoint]
    attempts_per_topic: list[AttemptsPoint]
