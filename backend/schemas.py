from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class MenuItemResponse(BaseModel):
    id: int
    name: str
    price: float
    category: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class OrderItemCreate(BaseModel):
    menu_id: int
    quantity: int = Field(..., gt=0)


class OrderCreate(BaseModel):
    table_no: Optional[int] = None
    items: List[OrderItemCreate]


class OrderItemResponse(BaseModel):
    id: int
    menu_id: int
    quantity: int
    menu: MenuItemResponse

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    table_no: Optional[int] = None
    status: str
    total_price: float
    timestamp: datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: str
