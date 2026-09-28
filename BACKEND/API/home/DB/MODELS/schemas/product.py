from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=2000)
    price: Decimal = Field(..., ge=0)
    cost_price: Decimal = Field(default=0, ge=0)
    selling_price: Optional[Decimal] = Field(default=None, ge=0)
    stock_quantity: int = Field(..., gt=0)
    image_url: Optional[str] = Field(default=None, max_length=10_000_000)
    category_id: int = Field(..., gt=0)


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1, max_length=2000)
    price: Optional[Decimal] = Field(None, ge=0)
    cost_price: Optional[Decimal] = Field(None, ge=0)
    selling_price: Optional[Decimal] = Field(None, ge=0)
    stock_quantity: Optional[int] = Field(None, gt=0)
    image_url: Optional[str] = Field(None, max_length=10_000_000)
    category_id: Optional[int] = Field(None, gt=0)


class ProductRead(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: Decimal
    cost_price: Decimal = Decimal('0')
    selling_price: Decimal = Decimal('0')
    stock_quantity: int
    image_url: Optional[str] = None
    category_id: int
    created_at: datetime

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class ProductPublic(BaseModel):
    id: int
    name: str
    price: Decimal
    image_url: Optional[str] = None

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )