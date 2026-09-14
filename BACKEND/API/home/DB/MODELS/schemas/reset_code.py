from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from pydantic import ConfigDict
from pydantic.alias_generators import to_camel
from sqlmodel import SQLModel


class ResetCodeCreate(SQLModel):
    email: str


class ResetCodeVerify(SQLModel):
    email: str
    code: str


class ResetCodeRead(SQLModel):
    email: str
    code: str
    created_at: datetime
    expires_at: datetime

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )