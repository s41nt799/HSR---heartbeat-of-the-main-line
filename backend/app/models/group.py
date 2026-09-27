from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class GroupsType(str, Enum):
    COMPANY = 'company'
    DEPOT = 'depot'
    BRIGADE = 'brigade'

class Group(Base):
    __tablename__ = 'groups'

    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    type: Mapped[GroupsType] = mapped_column(
        SQLEnum(GroupsType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    parent_id: Mapped[str | None] = mapped_column(ForeignKey('groups.id'), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True),server_default=func.now())
