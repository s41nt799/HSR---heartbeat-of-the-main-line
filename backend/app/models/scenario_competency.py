from sqlalchemy import CheckConstraint, ForeignKey, text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class ScenarioCompetency(Base):
    __tablename__ = 'scenario_competencies'

    scenario_id: Mapped[str] = mapped_column(ForeignKey('scenarios.id'), primary_key=True)
    competency_code: Mapped[str] = mapped_column(ForeignKey('competencies.code'),primary_key=True)
    weight: Mapped[int] = mapped_column(nullable=False, server_default=text('1'))

    __table_args__ = (
        CheckConstraint('weight > 0', name='ck_scenario_competencies_weight_positive'),
    )
