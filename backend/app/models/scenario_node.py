import uuid
from enum import Enum

from sqlalchemy import CheckConstraint, ForeignKey, Index, String, text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class ScenariosTypes(str, Enum):
    START = 'start'
    DIALOGUE = 'dialogue'
    CRITICAL = 'critical'
    ENDING_SUCCESS = 'ending_success'
    ENDING_FAIL = 'ending_fail'


class ScenarioNode(Base):
    __tablename__ = 'scenario_nodes'
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, server_default=text('gen_random_uuid()'))
    scenario_id: Mapped[str] = mapped_column(ForeignKey('scenarios.id'), nullable=False, index=True)
    node_key: Mapped[str] = mapped_column(String(50), nullable=False)
    type: Mapped[ScenariosTypes] = mapped_column(
        SQLEnum(ScenariosTypes, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    node_text: Mapped[str] = mapped_column(String(1000), nullable=False)
    timer_sec: Mapped[int | None] = mapped_column(nullable=True)
    is_start: Mapped[bool] = mapped_column(nullable=False, server_default=text('false'))

    __table_args__ = (
        CheckConstraint('timer_sec > 0', name='ck_scenario_nodes_timer_positive'),
        Index(
            'ix_scenario_nodes_scenario_node_unique',
            'scenario_id',
            'node_key',
            unique=True,
        ),
        Index(
            'ix_scenario_nodes_one_start',
            'scenario_id',
            unique=True,
            postgresql_where=text('is_start = true'),
        ),
    )
