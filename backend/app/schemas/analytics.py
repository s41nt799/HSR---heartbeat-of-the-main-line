import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CompetencyProgressItem(BaseModel):
    code: str
    title: str
    description: str | None = None
    score: int
    max_score: int
    progress_percent: int
    level: str

    model_config = ConfigDict(from_attributes=True)

class AnalyticsResponse(BaseModel):
    total_score: int
    competencies_count: int
    average_progress_percent: int
    items: list[CompetencyProgressItem]

    model_config = ConfigDict(from_attributes=True)

class WeakCompetencyItem(BaseModel):
    code: str
    title: str
    score: int
    progress_percent: int
    recommendation: str
    suggested_scenario_id: str | None = None

    model_config = ConfigDict(from_attributes=True)

class WeakAnalyticsResponse(BaseModel):
    weak_count: int
    items: list[WeakCompetencyItem]

    model_config = ConfigDict(from_attributes=True)

class CompetencyEffectHistoryItem(BaseModel):
    code: str
    title: str
    delta: int

    model_config = ConfigDict(from_attributes=True)

class ProgressHistoryItem(BaseModel):
    session_id: uuid.UUID
    scenario_id: str
    finished_at: datetime | None = None
    competency_effects: list[CompetencyEffectHistoryItem]
    score_delta: int

    model_config = ConfigDict(from_attributes=True)

class HistoryResponse(BaseModel):
    items: list[ProgressHistoryItem]
    total: int

    model_config = ConfigDict(from_attributes=True)
