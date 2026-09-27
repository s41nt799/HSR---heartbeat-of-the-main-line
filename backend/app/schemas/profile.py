import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from .user import UserResponse


class GroupResponse(BaseModel):
    id: str
    name: str
    type: str
    parent_id: str | None = None

    model_config = ConfigDict(from_attributes=True)

class TopCompetencyItem(BaseModel):
    code: str
    title: str
    score: int
    progress_percent: int

    model_config = ConfigDict(from_attributes=True)

class ProfileResponse(BaseModel):
    user: UserResponse
    group: GroupResponse | None = None
    total_score: int
    sessions_completed: int
    sessions_failed: int
    average_score: int
    top_competencies: list[TopCompetencyItem]

    model_config = ConfigDict(from_attributes=True)

class SessionHistoryItem(BaseModel):
    session_id: uuid.UUID
    scenario_id: str
    state: str
    score: int
    started_at: datetime
    finished_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

class SessionHistoryResponse(BaseModel):
    items: list[SessionHistoryItem]
    total: int

    model_config = ConfigDict(from_attributes=True)
