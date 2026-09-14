from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .category import Category
    from .cart_item import CartItem
    from .review import Review
    from .order_item import OrderItem


class Product(SQLModel, table=True):
    __tablename__ = "products"

    id: Optional[int] = Field(default=None, primary_key=True)

    name: str = Field(index=True, unique=True)
    description: Optional[str] = Field(default=None)

    price: Decimal = Field(
        default=Decimal("0.00"),
        max_digits=10,
        decimal_places=2,
    )

    stock_quantity: int = Field(default=0)

    image_url: Optional[str] = Field(default=None)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )

    category_id: int = Field(foreign_key="categories.id")

    category: "Category" = Relationship(back_populates="products")

    reviews: List["Review"] = Relationship(back_populates="product")

    cart_items: List["CartItem"] = Relationship(back_populates="product")

    order_items: List["OrderItem"] = Relationship(back_populates="product")