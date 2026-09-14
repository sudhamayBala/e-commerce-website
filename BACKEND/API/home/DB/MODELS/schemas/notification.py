from datetime import datetime
from typing import Optional

from pydantic import ConfigDict, EmailStr
from pydantic.alias_generators import to_camel
from sqlmodel import SQLModel
from typing import List, Optional, TYPE_CHECKING

from API.home.DB.MODELS.Table.notification import NotificationType


class NotificationCreate(SQLModel):
    recipient_email: EmailStr
    title: str
    message: str
    notification_type: NotificationType = NotificationType.ORDER_UPDATE
    user_id: int


class NotificationUpdate(SQLModel):
    title: Optional[str] = None
    message: Optional[str] = None
    notification_type: Optional[NotificationType] = None


class NotificationRead(SQLModel):
    id: int
    recipient_email: EmailStr
    title: str
    message: str
    notification_type: NotificationType
    user_id: int
    created_at: datetime

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class NotificationPublic(SQLModel):
    id: int
    title: str
    message: str
    notification_type: NotificationType