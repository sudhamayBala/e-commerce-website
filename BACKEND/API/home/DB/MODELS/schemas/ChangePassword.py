from pydantic import BaseModel, Field


class ChangePasswordSchema(BaseModel):
    email: str
    old_password: str
    new_password: str = Field(min_length=8)