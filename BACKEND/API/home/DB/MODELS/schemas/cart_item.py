from decimal import Decimal
from typing import List, Optional, TYPE_CHECKING
from pydantic import ConfigDict
from pydantic.alias_generators import to_camel
from sqlmodel import SQLModel


class CartItemCreate(SQLModel):
    cart_id: int
    product_id: int
    quantity: int


class CartItemUpdate(SQLModel):
    quantity: Optional[int] = None


class CartItemRead(SQLModel):
    id: int
    cart_id: int
    product_id: int
    quantity: int
    unit_price: Decimal

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class CartItemPublic(SQLModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal