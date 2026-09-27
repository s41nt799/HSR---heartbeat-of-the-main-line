import uuid
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field


class SessionStartRequest(BaseModel):
    scenario_id: Annotated[str, Field(max_length=50)]

    model_config = ConfigDict(extra='forbid')


class ChoiceRequest(BaseModel):
    choice_key: Annotated[str, Field(max_length=50)]
    version: Annotated[int, Field(ge=0, description='Версия сессии для защиты от гонок')]

    model_config = ConfigDict(extra='forbid')


class ChoiceItem(BaseModel):
    choice_key: str
    choice_text: str
    recommendation: str | None = None
    is_visible: bool = True

    model_config = ConfigDict(from_attributes=True)


class CompetencyEffectItem(BaseModel):
    code: str
    title: str
    delta: int

    model_config = ConfigDict(from_attributes=True)


class SessionEventItem(BaseModel):
    event_type: str
    node_key: str
    choice_key: str | None = None
    loyalty_after: int
    safety_after: int
    score_delta: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CompetencyProgressItem(BaseModel):
    code: str
    title: str
    delta: int
    total_score: int

    model_config = ConfigDict(from_attributes=True)


class AchievementItem(BaseModel):
    code: str
    title: str
    description: str
    icon: str | None = None

    model_config = ConfigDict(from_attributes=True)


class SessionResponse(BaseModel):
    session_id: uuid.UUID
    scenario_id: str
    current_node_key: str
    state: str
    loyalty: int
    safety: int
    score: int
    deadline: datetime | None = None
    started_at: datetime
    is_restarted: bool = False

    model_config = ConfigDict(from_attributes=True)


class NodeResponse(BaseModel):
    node_key: str
    type: str
    text: str
    timer_sec: int | None = None
    timer_left_sec: int | None = None
    choices: list[ChoiceItem]

    model_config = ConfigDict(from_attributes=True)


class ChoiceResultResponse(BaseModel):
    session_id: uuid.UUID
    new_node_key: str
    loyalty_delta: int
    safety_delta: int
    score_delta: int
    competency_effects: list[CompetencyEffectItem]
    new_state: str
    finished: bool

    model_config = ConfigDict(from_attributes=True)


class SessionDebriefResponse(BaseModel):
    session_id: uuid.UUID
    scenario_id: str
    state: str
    final_score: int
    loyalty: int
    safety: int
    duration_sec: int
    events: list[SessionEventItem]
    competency_progress: list[CompetencyProgressItem]
    achievements_unlocked: list[AchievementItem]
    recommendations: list[str]

    model_config = ConfigDict(from_attributes=True)
