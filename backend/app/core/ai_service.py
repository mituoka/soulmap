from openai import OpenAI
from app.config import settings
from typing import Dict, Any
import json

client = None
if settings.OPENAI_API_KEY:
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

ANALYSIS_PROMPT = """
あなたは心理分析の専門家です。以下の日記・ジャーナル投稿を分析し、JSON形式で結果を返してください。

投稿内容:
タイトル: {title}
本文: {content}
気分: {mood}

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


async def analyze_post(title: str, content: str, mood: str = None) -> Dict[str, Any]:
    """投稿内容をOpenAI APIで分析"""
    if not client:
        # OpenAI APIキーが設定されていない場合はモックデータを返す
        return {
            "result": {
                "emotions": {
                    "joy": 0.5,
                    "sadness": 0.2,
                    "anger": 0.1,
                    "fear": 0.1,
                    "surprise": 0.1
                },
                "topics": ["日常", "振り返り"],
                "personality_traits": {
                    "openness": 0.7,
                    "conscientiousness": 0.6,
                    "extraversion": 0.5,
                    "agreeableness": 0.7,
                    "neuroticism": 0.3
                },
                "interests": ["自己成長"],
                "summary": "OpenAI APIキーが設定されていないため、モックデータを返しています。"
            },
            "tokens_used": 0,
            "model_version": "mock"
        }

    prompt = ANALYSIS_PROMPT.format(
        title=title or "（タイトルなし）",
        content=content,
        mood=mood or "（指定なし）"
    )

    response = client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=[
            {"role": "system", "content": "You are a psychological analysis expert. Always respond in valid JSON format."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        max_tokens=1000,
        response_format={"type": "json_object"}
    )

    result_text = response.choices[0].message.content
    result = json.loads(result_text)

    return {
        "result": result,
        "tokens_used": response.usage.total_tokens,
        "model_version": "gpt-4-turbo-preview"
    }


async def generate_user_summary(analyses: list) -> Dict[str, Any]:
    """複数の分析結果からユーザーサマリーを生成"""
    if not analyses:
        return {
            "overall_summary": "分析データがありません",
            "dominant_emotions": [],
            "key_interests": [],
            "personality_overview": "",
            "recommendations": []
        }

    if not client:
        # モックデータ
        return {
            "overall_summary": "OpenAI APIキーが設定されていないため、サマリーを生成できません。",
            "dominant_emotions": ["joy"],
            "key_interests": ["自己成長"],
            "personality_overview": "モックデータです",
            "recommendations": ["APIキーを設定してください"]
        }

    analyses_text = "\n".join([
        f"- {a.created_at.strftime('%Y-%m-%d')}: {a.result.get('summary', '')}"
        for a in analyses[:10]
    ])

    response = client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=[
            {"role": "system", "content": "You are a psychological analysis expert."},
            {"role": "user", "content": f"""
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
"""}
        ],
        temperature=0.7,
        response_format={"type": "json_object"}
    )

    return json.loads(response.choices[0].message.content)
