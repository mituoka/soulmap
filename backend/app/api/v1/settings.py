from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.ai_service import get_available_models, get_current_model, set_current_model

router = APIRouter()


class ModelSetting(BaseModel):
    model_id: str


@router.get("/models")
async def list_models():
    """利用可能なAIモデル一覧を取得"""
    return {
        "models": get_available_models(),
        "current": get_current_model()
    }


@router.put("/models")
async def update_model(setting: ModelSetting):
    """AIモデルを変更"""
    if set_current_model(setting.model_id):
        return {"current": setting.model_id}
    raise HTTPException(status_code=400, detail="Invalid model ID")
