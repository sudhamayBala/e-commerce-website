from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .product import Product


class Category(SQLModel, table=True):
    __tablename__ = "categories"

    id: int | None = Field(
        default=None,
        primary_key=True
    )

    name: str
    description: str | None = None

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )

                         
    products: list["Product"] = Relationship(
        back_populates="category"
    )