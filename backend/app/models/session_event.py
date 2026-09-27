import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, func, text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class SessionEventTypes(str, Enum):
    CHOICE = 'choice'
    TIMEOUT = 'timeout'
    FINISH = 'finish'
    FAIL = 'fail'
    ABANDON = 'abandon'


class SessionEvent(Base):
    __tablename__ = 'session_events'

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, server_default=text('gen_random_uuid()'))
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('play_sessions.id'), nullable=False)
    node_key: Mapped[str] = mapped_column(String(50), nullable=False)
    choice_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey('choices.id'), nullable=True)
    choice_key: Mapped[str | None] = mapped_column(String(50), nullable=True)
    event_type: Mapped[SessionEventTypes] = mapped_column(
        SQLEnum(SessionEventTypes, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    effects: Mapped[dict] = mapped_column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    competency_effects: Mapped[list] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    loyalty_after: Mapped[int] = mapped_column(nullable=False)
    safety_after: Mapped[int] = mapped_column(nullable=False)
    score_delta: Mapped[int] = mapped_column(nullable=False)
    timer_sec: Mapped[int | None] = mapped_column(nullable=True)
    timer_left_sec: Mapped[int | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    __table_args__ = (
        CheckConstraint(
            'loyalty_after >= 0 AND loyalty_after <= 100',
            name='ck_session_events_loyalty_after_range',
        ),
        CheckConstraint(
            'safety_after >= 0 AND safety_after <= 100',
            name='ck_session_events_safety_after_range',
        ),
        CheckConstraint(
            'timer_sec IS NULL OR timer_sec >= 0',
            name='ck_session_events_timer_sec_non_negative',
        ),
        CheckConstraint(
            'timer_left_sec IS NULL OR timer_left_sec >= 0',
            name='ck_session_events_timer_left_sec_non_negative',
        ),
        Index(
            'ix_session_events_session_id_created_at',
            'session_id',
            'created_at',
        ),
    )
