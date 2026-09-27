from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field


class ScenarioCompetencyItem(BaseModel):
    code: Annotated[str, Field(description='Код компетенции')]
    title: Annotated[str, Field(description='Название компетенции')]
    weight: Annotated[int, Field(description='Вес компетенции в сценарии')]

    model_config = ConfigDict(from_attributes=True)

class ScenarioListItem(BaseModel):
    id: Annotated[str, Field(description='Slug')]
    title: Annotated[str, Field(min_length=3, max_length=100, description='Название')]
    description: Annotated[str, Field(min_length=10, max_length=1000, description='Краткое описание')]
    difficulty: Annotated[str | None, Field(max_length=20, description='Сложность')] = None
    competencies: Annotated[list[str], Field(description='Коды компетенций')]
    best_score: Annotated[int | None, Field(description='Лучший счет пользователя по этому сценарию')] = None

    model_config = ConfigDict(from_attributes=True)

class ScenarioListResponse(BaseModel):
    items: list[ScenarioListItem]
    total: int

class ScenarioDetailResponse(BaseModel):
    id: str
    title: str
    description: str
    difficulty: str | None = None
    version: int
    competencies: list[ScenarioCompetencyItem]
    nodes_count: int
    choices_count: int
    best_score: int | None = None
    sessions_completed: int = 0

    model_config = ConfigDict(from_attributes=True)
