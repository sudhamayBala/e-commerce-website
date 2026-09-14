from datetime import datetime
from decimal import Decimal
from typing import List, Optional, TYPE_CHECKING
from pydantic import EmailStr
from pydantic import ConfigDict, EmailStr
from pydantic.alias_generators import to_camel
from sqlmodel import SQLModel

from API.home.DB.MODELS.Table.payment import PaymentStatus


class PaymentCreate(SQLModel):
    amount: Decimal
    currency: str = "INR"
    recipient_email: EmailStr
    user_id: int


class PaymentUpdate(SQLModel):
    status: Optional[PaymentStatus] = None


class PaymentRead(SQLModel):
    id: int
    amount: Decimal
    currency: str
    status: PaymentStatus
    recipient_email: EmailStr
    user_id: int
    created_at: datetime

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class PaymentPublic(SQLModel):
    id: int
    amount: Decimal
    currency: str
    status: PaymentStatus