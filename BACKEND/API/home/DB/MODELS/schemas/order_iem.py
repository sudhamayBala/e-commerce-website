from decimal import Decimal
from typing import Optional
from typing import List, Optional, TYPE_CHECKING
from pydantic import ConfigDict
from pydantic.alias_generators import to_camel
from sqlmodel import SQLModel


class OrderItemCreate(SQLModel):
    quantity: int
    unit_price: Decimal
    unit_cost_price: Decimal = Decimal("0.00")
    unit_selling_price: Decimal = Decimal("0.00")
    order_id: int
    product_id: int


class OrderItemUpdate(SQLModel):
    quantity: Optional[int] = None
    unit_cost_price: Optional[Decimal] = None
    unit_selling_price: Optional[Decimal] = None
    is_reviewed: Optional[bool] = None


class OrderItemRead(SQLModel):
    id: int
    quantity: int
    unit_price: Decimal
    unit_cost_price: Decimal = Decimal("0.00")
    unit_selling_price: Decimal = Decimal("0.00")
    is_reviewed: bool
    order_id: int
    product_id: int

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class OrderItemPublic(SQLModel):
    id: int
    quantity: int
    unit_price: Decimal