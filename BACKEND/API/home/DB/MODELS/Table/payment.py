from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from typing import List, Optional, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .order import Order
    from .user import User


class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class Payment(SQLModel, table=True):
    __tablename__ = "payments"

    id: Optional[int] = Field(default=None, primary_key=True)

    amount: Decimal = Field(
        default=Decimal("0.00"),
        max_digits=10,
        decimal_places=2,
    )

    currency: str = Field(default="INR", max_length=10)

    status: PaymentStatus = Field(default=PaymentStatus.PENDING)

    recipient_email: str = Field(index=True)

    user_id: int = Field(foreign_key="users.id")

    order_id: int = Field(foreign_key="orders.id", unique=True)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )

    user: "User" = Relationship(back_populates="payments")

    order: "Order" = Relationship(back_populates="payment")