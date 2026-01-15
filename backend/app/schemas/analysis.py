from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import Optional, Dict, Any


class AnalysisCreate(BaseModel):
    post_id: UUID4


class AnalysisResponse(BaseModel):
    id: UUID4
    post_id: UUID4
    user_id: UUID4
    analysis_type: str
    result: Dict[str, Any]
    tokens_used: Optional[int] = None
    model_version: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserSummaryResponse(BaseModel):
    user_id: str
    total_posts_analyzed: int
    summary: Dict[str, Any]
