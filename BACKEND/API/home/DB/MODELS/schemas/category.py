from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from pydantic import ConfigDict
from pydantic.alias_generators import to_camel
from sqlmodel import SQLModel


class CategoryCreate(SQLModel):
    name: str
    description: Optional[str] = None


class CategoryUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None


class CategoryRead(SQLModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class CategoryPublic(SQLModel):
    id: int
    name: str