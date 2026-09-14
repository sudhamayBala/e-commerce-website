from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from pydantic import ConfigDict
from pydantic.alias_generators import to_camel
from sqlmodel import SQLModel
from builtins import str ,int
class ReviewSchema(SQLModel):
    id: Optional[str] = None
    rating: Optional[int] = None
    comment: Optional[str] = None
    product_id: Optional[str] = None
    user_id: Optional[str] = None