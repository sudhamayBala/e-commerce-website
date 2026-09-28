from decimal import Decimal
from typing import TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .product import Product
    from .cart import Cart


class CartItem(SQLModel, table=True):
    __tablename__ = "cart_items"

    id: int | None = Field(
        default=None,
        primary_key=True
    )

    cart_id: int = Field(
        foreign_key="carts.id"
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

    product: "Product" = Relationship(
        back_populates="cart_items"
    )

    cart: "Cart" = Relationship(
        back_populates="cart_items"
    )