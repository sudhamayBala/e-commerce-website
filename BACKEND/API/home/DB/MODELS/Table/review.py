from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .product import Product
    from .user import User


class Review(SQLModel, table=True):
    __tablename__ = "reviews"

    id: int | None = Field(
        default=None,
        primary_key=True
    )

    product_id: int = Field(
        foreign_key="products.id"
    )

    user_id: int = Field(
        foreign_key="users.id"
    )

    username: str = Field(default="")
    rating: int
    comment: str
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )

    product: "Product" = Relationship(
        back_populates="reviews"
    )

    user: "User" = Relationship(
        back_populates="reviews"
    )