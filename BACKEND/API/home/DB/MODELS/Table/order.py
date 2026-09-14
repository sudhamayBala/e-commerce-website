
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from typing import List, Optional, TYPE_CHECKING
from builtins import str, bool, int
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .user import User
    from .payment import Payment
    from .order_item import OrderItem


class OrderStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class Order(SQLModel, table=True):
    __tablename__ = "orders"

    # Primary Key
    id: Optional[int] = Field(
        default=None,
        primary_key=True
    )

    # Order Details
    total_price: Decimal = Field(
        default=Decimal("0.00"),
        max_digits=10,
        decimal_places=2
    )

    customer_name: str
    customer_id: str
    shipping_address: str
    product_type: str

    # Order Status
    status: OrderStatus = Field(
        default=OrderStatus.PENDING
    )

    # Cancellation
    user_cancellation: bool = Field(
        default=False
    )

    # Date
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )

    # Foreign Key
    user_id: int = Field(
        foreign_key="users.id"
    )

    # Relationships
    user: "User" = Relationship(
        back_populates="orders"
    )

    payment: Optional["Payment"] = Relationship(
        back_populates="order"
    )

    order_items: List["OrderItem"] = Relationship(
        back_populates="order"
    )

    # Payment Information
    payment_status: bool = Field(
        default=False
    )

    payment_method: str

    refunded: bool = Field(
        default=False,
        index=True
    )

