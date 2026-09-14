from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from pydantic import ConfigDict
from pydantic.alias_generators import to_camel
from sqlmodel import SQLModel


class CartCreate(SQLModel):
    user_id: int


class CartRead(SQLModel):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class CartPublic(SQLModel):
    id: int
    user_id: int