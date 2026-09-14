from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import ConfigDict, EmailStr
from pydantic.alias_generators import to_camel
from sqlmodel import SQLModel


class UserRole(str, Enum):
    ADMIN = "Admin"
    CUSTOMER = "Customer"
    DELIVERY = "Delivery"


# ============================================================
# USER CREATE
# ============================================================

class UserCreate(SQLModel):
    email: EmailStr
    password: str
    profile_picture: Optional[str] = None
    address: Optional[str] = None
    role: UserRole = UserRole.CUSTOMER


# ============================================================
# LOGIN REQUEST
# ============================================================

class LoginRequest(SQLModel):
    email: EmailStr
    password: str


# ============================================================
# API RESPONSE
# ============================================================

# ============================================================
# USER UPDATE
# ============================================================

class UserUpdate(SQLModel):
    profile_picture: Optional[str] = None
    address: Optional[str] = None
    active: Optional[bool] = None
    role: Optional[UserRole] = None


# ============================================================
# USER READ
# ============================================================

class UserRead(SQLModel):
    id: int
    email: EmailStr
    profile_picture: Optional[str] = None
    address: Optional[str] = None
    role: UserRole
    active: bool
    created_at: datetime

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


# ============================================================
# USER PUBLIC
# ============================================================

class UserPublic(SQLModel):
    id: int
    email: EmailStr
    role: UserRole


class LoginResponse(UserPublic):
    access_token: str
    token_type: str = "bearer"