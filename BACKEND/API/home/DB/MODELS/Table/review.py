from datetime import datetime, timezone
from typing import List, Optional, Union, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel
from builtins import str, int
if TYPE_CHECKING:
    from .product import Product
    from .user import User


class Review(SQLModel, table=True):
    __tablename__ = "reviews"

    id: Optional[int] = Field(default=None, primary_key=True)

    rating: int = Field(ge=1, le=5)
    comment: str
    username: str

    product_id: int = Field(foreign_key="products.id")
    user_id: int = Field(foreign_key="users.id")

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )

    product: "Product" = Relationship(back_populates="reviews")
    user: "User" = Relationship(back_populates="reviews")