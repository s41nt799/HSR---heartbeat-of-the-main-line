import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class UserAchievement(Base):
    __tablename__ = 'user_achievements'

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    achievement_code: Mapped[str] = mapped_column(ForeignKey('achievements.code', ondelete='CASCADE'), primary_key=True)
    unlocked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    session_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey('play_sessions.id', ondelete='SET NULL'), nullable=True)
