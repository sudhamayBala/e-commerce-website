from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel
if TYPE_CHECKING:
    from .user import User
    from ..cart_item import CartItem


class Cart(SQLModel, table=True):
    __tablename__ = "carts"

    id: Optional[int] = Field(default=None, primary_key=True)

    user_id: int = Field(
        foreign_key="users.id",
        unique=True
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )

    user: "User" = Relationship(back_populates="cart")

    items: List["CartItem"] = Relationship(
        back_populates="cart",
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan"
        }
    )