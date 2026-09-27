import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, func, text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class UsersRoles(str, Enum):
    CONDUCTOR = 'conductor'

class User(Base):
    __tablename__ = 'users'

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, server_default=text('gen_random_uuid()'))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(50), nullable=False)
    role: Mapped[UsersRoles] = mapped_column(
        SQLEnum(UsersRoles, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        server_default=UsersRoles.CONDUCTOR.value,
    )
    group_id: Mapped[str] = mapped_column(ForeignKey('groups.id'), nullable=False, index=True)
    level: Mapped[int] = mapped_column(nullable=False, server_default=text('1'))
    xp: Mapped[int] = mapped_column(nullable=False, server_default=text('0'))
    total_score: Mapped[int] = mapped_column(nullable=False, server_default=text('0'))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
            CheckConstraint('xp >= 0', name='ck_users_xp_non_negative'),
            CheckConstraint('total_score >= 0', name='ck_users_total_score_non_negative'),
        )
