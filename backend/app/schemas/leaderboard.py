import uuid

from pydantic import BaseModel, ConfigDict


class LeaderboardItem(BaseModel):
    position: int
    user_id: uuid.UUID
    username: str | None = None
    level: int
    total_score: int
    sessions_completed: int

    model_config = ConfigDict(from_attributes=True)

class LeaderboardResponse(BaseModel):
    total: int
    items: list[LeaderboardItem]
    current_user_position: int | None = None

    model_config = ConfigDict(from_attributes=True)
