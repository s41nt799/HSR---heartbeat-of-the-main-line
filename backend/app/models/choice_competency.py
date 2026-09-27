import uuid

from sqlalchemy import CheckConstraint, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class ChoiceCompetency(Base):
    __tablename__ = 'choice_competencies'

    choice_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('choices.id'), primary_key=True)
    competency_code: Mapped[str] = mapped_column(ForeignKey('competencies.code'), primary_key=True)
    delta: Mapped[int] = mapped_column(nullable=False)

    __table_args__ = (
            CheckConstraint('delta >= -10 AND delta <= 15', name='ck_choice_competencies_delta_range'),
        )
