from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .user import User


class NotificationType(str, Enum):
    WELCOME = "welcome"
    ORDER_UPDATE = "order_update"
    PAYMENT_UPDATE = "payment_update"
    PROMOTIONAL = "promotional"
    SECURITY = "security"


class Notification(SQLModel, table=True):
    __tablename__ = "notifications"

    id: Optional[int] = Field(default=None, primary_key=True)

    recipient_email: str = Field(index=True)

    title: str

    message: str

    notification_type: NotificationType = Field(
        default=NotificationType.ORDER_UPDATE
    )

    user_id: int = Field(foreign_key="users.id")

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )

    user: "User" = Relationship(back_populates="notifications")