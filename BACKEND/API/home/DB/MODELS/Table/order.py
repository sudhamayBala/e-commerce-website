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

                 
    id: Optional[int] = Field(
        default=None,
        primary_key=True
    )

                   
    total_price: Decimal = Field(
        default=Decimal("0.00"),
        max_digits=10,
        decimal_places=2
    )

    customer_name: Optional[str] = Field(default=None)
    customer_id: Optional[str] = Field(default=None)
    shipping_address: Optional[str] = Field(default=None)
    product_type: Optional[str] = Field(default=None)

                  
    status: OrderStatus = Field(
        default=OrderStatus.PENDING
    )

                  
    user_cancellation: bool = Field(
        default=False
    )

          
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )

                 
    user_id: int = Field(
        foreign_key="users.id"
    )

                   
    user: "User" = Relationship(
        back_populates="orders"
    )

    payment: Optional["Payment"] = Relationship(
        back_populates="order"
    )

    order_items: List["OrderItem"] = Relationship(
        back_populates="order"
    )

                         
    payment_status: bool = Field(
        default=False
    )

    payment_method: Optional[str] = Field(default=None)

    refunded: bool = Field(
        default=False,
        index=True
    )