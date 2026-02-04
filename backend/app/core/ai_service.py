import google.generativeai as genai
from app.config import settings
from typing import Dict, Any, List
import json

# 利用可能なモデル（無料枠で利用可能なもののみ）
AVAILABLE_MODELS = [
    {"id": "gemini-flash-latest", "name": "Gemini Flash", "provider": "google", "description": "高速・無料"},
]

# 現在選択されているモデル（デフォルト）
current_model_id = "gemini-flash-latest"

# クライアント初期化
gemini_configured = False

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    gemini_configured = True


def get_available_models() -> List[Dict[str, str]]:
    """利用可能なモデル一覧を取得（APIキーが設定されているもののみ）"""
    if gemini_configured:
        return AVAILABLE_MODELS
    return []


def get_current_model() -> str:
    """現在のモデルIDを取得"""
    return current_model_id


def set_current_model(model_id: str) -> bool:
    """モデルを変更"""
    global current_model_id
    available = get_available_models()
    if any(m["id"] == model_id for m in available):
        current_model_id = model_id
        return True
    return False


def get_model_info(model_id: str) -> Dict[str, str] | None:
    """モデル情報を取得"""
    for model in AVAILABLE_MODELS:
        if model["id"] == model_id:
            return model
    return None


ANALYSIS_PROMPT = """
あなたは心理分析の専門家です。以下の日記・ジャーナル投稿を分析し、JSON形式で結果を返してください。

投稿内容:
タイトル: {title}
本文: {content}

以下の形式で分析結果を返してください:
{{
  "emotions": {{
    "joy": 0.0-1.0の数値,
    "sadness": 0.0-1.0の数値,
    "anger": 0.0-1.0の数値,
    "fear": 0.0-1.0の数値,
    "surprise": 0.0-1.0の数値
  }},
  "topics": ["検出されたトピック1", "トピック2", "トピック3"],
  "personality_traits": {{
    "openness": 0.0-1.0の数値,
    "conscientiousness": 0.0-1.0の数値,
    "extraversion": 0.0-1.0の数値,
    "agreeableness": 0.0-1.0の数値,
    "neuroticism": 0.0-1.0の数値
  }},
  "interests": ["関心事1", "関心事2"],
  "summary": "分析結果の要約（2-3文）"
}}

JSONのみを返し、他のテキストは含めないでください。
"""


async def call_gemini(prompt: str, model_id: str) -> tuple[str, int]:
    """Gemini APIを呼び出し"""
    model = genai.GenerativeModel(model_id)
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.7,
            max_output_tokens=1000,
        )
    )
    tokens = response.usage_metadata.total_token_count if response.usage_metadata else 0
    return response.text, tokens


async def analyze_post(title: str, content: str, mood: str = None) -> Dict[str, Any]:
    """投稿内容をAI APIで分析"""
    if not gemini_configured:
        return _mock_response("Gemini APIキーが設定されていません")

    prompt = ANALYSIS_PROMPT.format(
        title=title or "（タイトルなし）",
        content=content
    )

    try:
        text, tokens = await call_gemini(prompt, current_model_id)
        result = json.loads(text)
        return {
            "result": result,
            "tokens_used": tokens,
            "model_version": current_model_id
        }
    except Exception as e:
        return _mock_response(f"API呼び出しエラー: {str(e)}")


def _mock_response(message: str) -> Dict[str, Any]:
    """モックレスポンスを返す"""
    return {
        "result": {
            "emotions": {"joy": 0.5, "sadness": 0.2, "anger": 0.1, "fear": 0.1, "surprise": 0.1},
            "topics": ["日常"],
            "personality_traits": {
                "openness": 0.5, "conscientiousness": 0.5, "extraversion": 0.5,
                "agreeableness": 0.5, "neuroticism": 0.5
            },
            "interests": ["自己成長"],
            "summary": message
        },
        "tokens_used": 0,
        "model_version": "mock"
    }


async def generate_user_summary(analyses: list) -> Dict[str, Any]:
    """複数の分析結果からユーザーサマリーを生成"""
    empty_response = {
        "overall_summary": "",
        "dominant_emotions": [],
        "key_interests": [],
        "personality_overview": "",
        "recommendations": []
    }

    if not analyses:
        empty_response["overall_summary"] = "分析データがありません"
        return empty_response

    if not gemini_configured:
        empty_response["overall_summary"] = "Gemini APIキーが設定されていません"
        return empty_response

    analyses_text = "\n".join([
        f"- {a.created_at.strftime('%Y-%m-%d')}: {a.result.get('summary', '')}"
        for a in analyses[:10]
    ])

    prompt = f"""
以下はユーザーの日記分析結果の履歴です。全体的な傾向をJSON形式でまとめてください。

{analyses_text}

形式:
{{
  "overall_summary": "全体的な傾向の要約",
  "dominant_emotions": ["主要な感情1", "感情2"],
  "key_interests": ["主要な関心事1", "関心事2"],
  "personality_overview": "性格傾向の概要",
  "recommendations": ["おすすめ1", "おすすめ2"]
}}

JSONのみを返してください。
"""

    try:
        text, _ = await call_gemini(prompt, current_model_id)
        return json.loads(text)
    except Exception as e:
        empty_response["overall_summary"] = f"エラー: {str(e)}"
        return empty_response
