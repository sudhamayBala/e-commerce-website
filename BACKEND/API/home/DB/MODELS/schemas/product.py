from datetime import datetime
from decimal import Decimal
from typing import Optional
from typing import List, Optional, TYPE_CHECKING
from pydantic import ConfigDict
from pydantic.alias_generators import to_camel
from sqlmodel import SQLModel


class ProductCreate(SQLModel):
    name: str
    description: Optional[str] = None
    price: Decimal
    stock_quantity: int
    image_url: Optional[str] = None
    category_id: int


class ProductUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    stock_quantity: Optional[int] = None
    image_url: Optional[str] = None
    category_id: Optional[int] = None


class ProductRead(SQLModel):
    id: int
    name: str
    description: Optional[str] = None
    price: Decimal
    stock_quantity: int
    image_url: Optional[str] = None
    category_id: int
    created_at: datetime

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class ProductPublic(SQLModel):
    id: int
    name: str
    price: Decimal
    image_url: Optional[str] = None