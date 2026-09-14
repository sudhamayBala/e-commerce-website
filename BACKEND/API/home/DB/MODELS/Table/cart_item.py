from decimal import Decimal
from typing import Optional, TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .Table.cart import Cart
    from .product import Product


class CartItem(SQLModel, table=True):
    __tablename__ = "cart_items"

    id: Optional[int] = Field(default=None, primary_key=True)

    cart_id: int = Field(foreign_key="carts.id")

    product_id: int = Field(foreign_key="products.id")

    quantity: int = Field(default=1, ge=1)

    unit_price: Decimal = Field(
        default=Decimal("0.00"),
        max_digits=10,
        decimal_places=2,
    )

    cart: "Cart" = Relationship(back_populates="items")

    product: "Product" = Relationship(back_populates="cart_items")