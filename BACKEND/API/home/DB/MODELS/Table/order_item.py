from decimal import Decimal
from typing import List, Optional, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .order import Order
    from .product import Product


class OrderItem(SQLModel, table=True):
    __tablename__ = "order_items"

    id: Optional[int] = Field(default=None, primary_key=True)

    quantity: int = Field(default=1, ge=1)

    unit_price: Decimal = Field(
        default=Decimal("0.00"),
        max_digits=10,
        decimal_places=2,
    )

    is_reviewed: bool = Field(default=False)

    order_id: int = Field(foreign_key="orders.id")

    product_id: int = Field(foreign_key="products.id")

    order: "Order" = Relationship(back_populates="order_items")

    product: "Product" = Relationship(back_populates="order_items")