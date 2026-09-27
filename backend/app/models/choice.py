import uuid
from typing import Any

from sqlalchemy import ForeignKey, Index, String, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class Choice(Base):
    __tablename__ = 'choices'

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, server_default=text('gen_random_uuid()'))
    node_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('scenario_nodes.id'), nullable=False)
    choice_key: Mapped[str] = mapped_column(String(50), nullable=False)
    choice_text: Mapped[str] = mapped_column(String(255), nullable=False)
    effects: Mapped[dict] = mapped_column(JSONB, nullable=False)
    requirements: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    recommendation: Mapped[str | None] = mapped_column(String(500), nullable=True)
    next_node_key: Mapped[str] = mapped_column(String(50), nullable=False)
    sort_order: Mapped[int] = mapped_column(nullable=False, server_default=text('0'))
    is_visible: Mapped[bool] = mapped_column(nullable=False, server_default=text('true'))

    __table_args__ = (
        Index(
            'ix_choices_node_id_choice_key',
            'node_id',
            'choice_key',
            unique=True,
        ),
    )
