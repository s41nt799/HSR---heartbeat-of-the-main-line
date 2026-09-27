import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, func, text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class UserCompetencyProgress(Base):
    __tablename__ = 'user_competency_progress'

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('users.id'), primary_key=True)
    competency_code: Mapped[str] = mapped_column(ForeignKey('competencies.code'), primary_key=True)
    score: Mapped[int] = mapped_column(nullable=False, server_default=text('0'))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint('score >= 0', name='ck_user_competency_progress_score_non_negative'),
    )
