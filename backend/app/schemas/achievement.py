from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AchievementItem(BaseModel):
    code: str
    title: str
    description: str
    icon: str | None = None
    condition: str
    unlocked: bool = False
    unlocked_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

class AchievementsResponse(BaseModel):
    total: int
    unlocked_count: int
    items: list[AchievementItem]

    model_config = ConfigDict(from_attributes=True)

class UserAchievementsResponse(BaseModel):
    count: int
    items: list[AchievementItem]

    model_config = ConfigDict(from_attributes=True)
