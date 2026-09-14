from typing import Optional

from sqlmodel import SQLModel


class ApiResponse(SQLModel):
    message: str
    access_token: Optional[str] = None
    token_type: Optional[str] = None