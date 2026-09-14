from builtins import str
from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, TYPE_CHECKING
from builtins import str,int,bool
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .order import Order
    from .notification import Notification
    from .payment import Payment
    from .review import Review
    from .cart import Cart


class UserRole(str, Enum):
    ADMIN = "Admin"
    CUSTOMER = "Customer"
    DELIVERY = "Delivery"

00
class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    profile_picture: Optional[str] = None
    address: Optional[str] = None
    role: UserRole = Field(default=UserRole.CUSTOMER, index=True)
    active: bool = Field(default=False)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )

    orders: List["Order"] = Relationship(back_populates="user")
    notifications: List["Notification"] = Relationship(back_populates="user")
    reviews: List["Review"] = Relationship(back_populates="user")
    payments: List["Payment"] = Relationship(back_populates="user")
    cart: Optional["Cart"] = Relationship(back_populates="user")
