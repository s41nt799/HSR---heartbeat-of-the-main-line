from sqlalchemy import String, text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class Achievement(Base):
    __tablename__ = 'achievements'

    code: Mapped[str] = mapped_column(String(50), primary_key=True)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(1000), nullable=False)
    condition_code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    icon: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sort_order: Mapped[int] = mapped_column(nullable=False, server_default=text('0'))
