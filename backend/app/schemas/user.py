import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    display_name: str
    role: str
    group_id: str
    level: int
    xp: int
    total_score: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
