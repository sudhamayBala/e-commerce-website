from datetime import datetime
from decimal import Decimal
from typing import Optional
from builtins import int,str,bool
from sqlmodel import SQLModel
from API.home.DB.MODELS.Table.order import OrderStatus


class OrderSchema(SQLModel):
    shipping_address: str
    user_id: int
    order_id: int
    customer_name: str
    product_type: str
    total_price: Optional[Decimal] = None
    status: bool = False
    created_at: Optional[datetime] = None
    user_cancle:bool = False
    ordder_panding:bool=False
    order_create_date=datetime.utcnow()
    shipping_date=datetime.utcnow()
    order_quantity:int
    pameynt_methord:str
    pameynt_status:bool


