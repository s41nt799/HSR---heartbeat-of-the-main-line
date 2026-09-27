import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, Index, String, func, text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class NotificationTypes(str, Enum):
    NEW_SCENARIO = 'new_scenario'
    CHALLENGE = 'challenge'
    EXPIRING_POINTS = 'expiring_points'
    ACHIEVEMENT = 'achievement'

class Notification(Base):
    __tablename__ = 'notifications'

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, server_default=text('gen_random_uuid()'))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('users.id'), nullable=False)
    type: Mapped[NotificationTypes] = mapped_column(
        SQLEnum(NotificationTypes, values_callable=lambda x: [e.value for e in x])
    )
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    body: Mapped[str] = mapped_column(String(1000), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index(
            'ix_notifications_user_id_read_at',
            'user_id',
            'read_at'
        ),
    )
