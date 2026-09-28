from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .category import Category
    from .cart_item import CartItem
    from .order_item import OrderItem
    from .review import Review


class Product(SQLModel, table=True):
    __tablename__ = "products"

    id: int | None = Field(
        default=None,
        primary_key=True
    )

    name: str
    description: str | None = None
    price: float = Field(default=0)
    cost_price: float = Field(default=0)
    selling_price: float = Field(default=0)
    stock_quantity: int
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )

    image_url: str | None = Field(
        default=None,
        max_length=10_000_000
    )

    category_id: int = Field(
        foreign_key="categories.id"
    )

                        
    category: "Category" = Relationship(
        back_populates="products"
    )

                        
    cart_items: list["CartItem"] = Relationship(
        back_populates="product"
    )

                         
    order_items: list["OrderItem"] = Relationship(
        back_populates="product"
    )

                      
    reviews: list["Review"] = Relationship(
        back_populates="product"
    )