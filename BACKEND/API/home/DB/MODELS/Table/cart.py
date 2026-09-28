from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional, List

from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .user import User
    from .cart_item import CartItem


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

    user: Optional["User"] = Relationship(
        back_populates="cart"
    )

    cart_items: List["CartItem"] = Relationship(
        back_populates="cart"
    )