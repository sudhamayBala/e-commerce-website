from datetime import datetime, timedelta, timezone
from typing import List, Optional, TYPE_CHECKING
from sqlmodel import Field, SQLModel


class ResetCodeModel(SQLModel, table=True):
    __tablename__ = "reset_code"

    email: str = Field(
        index=True,
        unique=True,
        nullable=False,
    )

    code: str = Field(
        primary_key=True,
        unique=True,
        index=True,
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )

    expires_at: datetime = Field(
        default_factory=lambda: (
            datetime.now(timezone.utc) + timedelta(minutes=10)
        ).replace(tzinfo=None)
    )