from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional


class TodoBase(BaseModel):
    title: str
    date: date


class TodoCreate(TodoBase):
    pass


class TodoUpdate(BaseModel):
    title: Optional[str] = None
    completed: Optional[bool] = None
    date: Optional[date] = None


class TodoResponse(TodoBase):
    id: int
    completed: bool
    created_at: datetime

    class Config:
        from_attributes = True
