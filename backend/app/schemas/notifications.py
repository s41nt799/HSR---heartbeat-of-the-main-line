import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from ..models.notification import NotificationTypes


class NotificationItem(BaseModel):
    id: uuid.UUID
    type: str
    title: str
    body: str
    metadata: dict | None = None
    read_at: datetime | None = None
    is_read: bool = False
    created_at: datetime | None = None


    model_config = ConfigDict(from_attributes=True)

class NotificationResponse(BaseModel):
    total: int
    unread_count: int
    items: list[NotificationItem]

    model_config = ConfigDict(from_attributes=True)
