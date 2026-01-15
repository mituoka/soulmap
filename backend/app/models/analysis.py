from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id = Column(UUID(as_uuid=True), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    analysis_type = Column(String(50), nullable=False, default="personality")
    result = Column(JSON, nullable=False)
    tokens_used = Column(Integer)
    model_version = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("Post", back_populates="analyses")
