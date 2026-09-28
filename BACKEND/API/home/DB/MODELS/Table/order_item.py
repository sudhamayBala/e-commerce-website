from decimal import Decimal
from typing import TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .order import Order
    from .product import Product


class OrderItem(SQLModel, table=True):
    __tablename__ = "order_items"

    id: int | None = Field(
        default=None,
        primary_key=True
    )

    order_id: int = Field(
        foreign_key="orders.id"
    )

    product_id: int = Field(
        foreign_key="products.id"
    )

    quantity: int = Field(
        default=1
    )

    unit_price: Decimal = Field(
        default=Decimal("0.00"),
        max_digits=10,
        decimal_places=2,
    )

    unit_cost_price: Decimal = Field(
        default=Decimal("0.00"),
        max_digits=10,
        decimal_places=2,
    )

    unit_selling_price: Decimal = Field(
        default=Decimal("0.00"),
        max_digits=10,
        decimal_places=2,
    )

    is_reviewed: bool = Field(
        default=False,
    )

    order: "Order" = Relationship(
        back_populates="order_items"
    )

    product: "Product" = Relationship(
        back_populates="order_items"
    )