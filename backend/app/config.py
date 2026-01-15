from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://soulmap:soulmap123@localhost:5432/soulmap_db"

    # JWT (ローカル認証)
    JWT_SECRET_KEY: str = "your-super-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # OpenAI
    OPENAI_API_KEY: str = ""

    # App
    DEBUG: bool = True
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"


settings = Settings()
