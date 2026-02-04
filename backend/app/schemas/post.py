from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import Optional, List


class PostBase(BaseModel):
    title: Optional[str] = None
    content: str
    mood: Optional[str] = None
    image_urls: List[str] = []


class PostCreate(PostBase):
    pass


class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    mood: Optional[str] = None
    image_urls: Optional[List[str]] = None


class PostResponse(PostBase):
    id: UUID4
    user_id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PostListResponse(BaseModel):
    posts: List[PostResponse]
    total: int
    page: int
    per_page: int
