import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, func, text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class PlaySessionStates(str, Enum):
    ACTIVE = 'active'
    COMPLETED = 'completed'
    FAILED = 'failed'
    EXPIRED = 'expired'
    ABANDONED = 'abandoned'

class PlaySession(Base):
    __tablename__ = 'play_sessions'

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, server_default=text('gen_random_uuid()'))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('users.id'), nullable=False)
    scenario_id: Mapped[str] = mapped_column(ForeignKey('scenarios.id'),nullable=False)
    current_node_key: Mapped[str] = mapped_column(String(50), nullable=False)
    state: Mapped[PlaySessionStates] = mapped_column(
        SQLEnum(PlaySessionStates, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        server_default=PlaySessionStates.ACTIVE.value,
    )
    loyalty: Mapped[int] = mapped_column(nullable=False, server_default=text('100'))
    safety: Mapped[int] = mapped_column(nullable=False, server_default=text('100'))
    score: Mapped[int] = mapped_column(nullable=False, server_default=text('0'))
    version: Mapped[int] = mapped_column(nullable=False, server_default=text('0'))
    deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False,server_default=func.now())
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint('loyalty >= 0 AND loyalty <= 100', name='ck_play_sessions_loyalty_range'),
        CheckConstraint('safety >= 0 AND safety <= 100', name='ck_play_sessions_safety_range'),
        CheckConstraint('score >= 0', name='ck_play_sessions_score_non_negative'),
        CheckConstraint('version >= 0', name='ck_play_sessions_version_non_negative'),
        Index('ix_play_sessions_user_id', 'user_id'),
        Index('ix_play_sessions_scenario_id', 'scenario_id'),
        Index('ix_play_sessions_state', 'state'),
        Index(
            'ix_play_sessions_one_active',
            'user_id',
            'scenario_id',
            unique=True,
            postgresql_where=text("state = 'active'"),
        ),
    )
