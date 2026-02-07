use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Debug, Serialize)]
struct GeminiRequest {
    contents: Vec<GeminiContent>,
    generation_config: GenerationConfig,
}

#[derive(Debug, Serialize)]
struct GeminiContent {
    parts: Vec<GeminiPart>,
}

#[derive(Debug, Serialize)]
struct GeminiPart {
    text: String,
}

#[derive(Debug, Serialize)]
struct GenerationConfig {
    temperature: f32,
    #[serde(rename = "maxOutputTokens")]
    max_output_tokens: i32,
    #[serde(rename = "responseMimeType")]
    response_mime_type: String,
}

#[derive(Debug, Deserialize)]
struct GeminiResponse {
    candidates: Vec<Candidate>,
    #[serde(rename = "usageMetadata")]
    usage_metadata: Option<UsageMetadata>,
}

#[derive(Debug, Deserialize)]
struct Candidate {
    content: CandidateContent,
}

#[derive(Debug, Deserialize)]
struct CandidateContent {
    parts: Vec<ResponsePart>,
}

#[derive(Debug, Deserialize)]
struct ResponsePart {
    text: String,
}

#[derive(Debug, Deserialize)]
struct UsageMetadata {
    #[serde(rename = "totalTokenCount")]
    total_token_count: i32,
}

const ANALYSIS_PROMPT: &str = r#"
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
"#;

pub async fn analyze_post(api_key: &str, title: Option<&str>, content: &str) -> Result<(serde_json::Value, i32), anyhow::Error> {
    if api_key.is_empty() {
        return Ok((mock_response("Gemini APIキーが設定されていません"), 0));
    }

    let prompt = ANALYSIS_PROMPT
        .replace("{title}", title.unwrap_or("（タイトルなし）"))
        .replace("{content}", content);

    let request = GeminiRequest {
        contents: vec![GeminiContent {
            parts: vec![GeminiPart { text: prompt }],
        }],
        generation_config: GenerationConfig {
            temperature: 0.7,
            max_output_tokens: 1000,
            response_mime_type: "application/json".to_string(),
        },
    };

    let client = reqwest::Client::new();
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={}",
        api_key
    );

    let response = client
        .post(&url)
        .json(&request)
        .send()
        .await?;

    if !response.status().is_success() {
        let error_text = response.text().await?;
        tracing::error!("Gemini API error: {}", error_text);

        // レート制限エラーをわかりやすいメッセージに変換
        let user_message = if error_text.contains("429") || error_text.contains("RESOURCE_EXHAUSTED") {
            "AI APIのレート制限に達しました。しばらく時間をおいてから再度お試しください。（毎日午前9時にリセットされます）"
        } else {
            "AI APIでエラーが発生しました。しばらくしてから再度お試しください。"
        };

        return Ok((mock_response(user_message), 0));
    }

    let gemini_response: GeminiResponse = response.json().await?;

    let text = gemini_response.candidates
        .first()
        .and_then(|c| c.content.parts.first())
        .map(|p| p.text.clone())
        .unwrap_or_default();

    let tokens = gemini_response.usage_metadata
        .map(|m| m.total_token_count)
        .unwrap_or(0);

    let result: serde_json::Value = serde_json::from_str(&text)
        .unwrap_or_else(|_| mock_response("JSONパースエラー"));

    Ok((result, tokens))
}

fn mock_response(message: &str) -> serde_json::Value {
    json!({
        "emotions": {"joy": 0.5, "sadness": 0.2, "anger": 0.1, "fear": 0.1, "surprise": 0.1},
        "topics": ["日常"],
        "personality_traits": {
            "openness": 0.5, "conscientiousness": 0.5, "extraversion": 0.5,
            "agreeableness": 0.5, "neuroticism": 0.5
        },
        "interests": ["自己成長"],
        "summary": message
    })
}

pub async fn generate_user_summary(api_key: &str, analyses_text: &str) -> Result<serde_json::Value, anyhow::Error> {
    if api_key.is_empty() || analyses_text.is_empty() {
        return Ok(json!({
            "overall_summary": "分析データがありません",
            "dominant_emotions": [],
            "key_interests": [],
            "personality_overview": "",
            "recommendations": []
        }));
    }

    let prompt = format!(r#"
以下はユーザーの日記分析結果の履歴です。全体的な傾向をJSON形式でまとめてください。

{}

形式:
{{
  "overall_summary": "全体的な傾向の要約",
  "dominant_emotions": ["主要な感情1", "感情2"],
  "key_interests": ["主要な関心事1", "関心事2"],
  "personality_overview": "性格傾向の概要",
  "recommendations": ["おすすめ1", "おすすめ2"]
}}

JSONのみを返してください。
"#, analyses_text);

    let request = GeminiRequest {
        contents: vec![GeminiContent {
            parts: vec![GeminiPart { text: prompt }],
        }],
        generation_config: GenerationConfig {
            temperature: 0.7,
            max_output_tokens: 1000,
            response_mime_type: "application/json".to_string(),
        },
    };

    let client = reqwest::Client::new();
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={}",
        api_key
    );

    let response = client.post(&url).json(&request).send().await?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();

        // レート制限エラーをわかりやすいメッセージに変換
        let message = if error_text.contains("429") || error_text.contains("RESOURCE_EXHAUSTED") {
            "AI APIのレート制限に達しました。しばらく時間をおいてから再度お試しください。（毎日午前9時にリセットされます）"
        } else {
            "サマリー生成でエラーが発生しました"
        };

        return Ok(json!({
            "overall_summary": message,
            "dominant_emotions": [],
            "key_interests": [],
            "personality_overview": "",
            "recommendations": []
        }));
    }

    let gemini_response: GeminiResponse = response.json().await?;
    let text = gemini_response.candidates
        .first()
        .and_then(|c| c.content.parts.first())
        .map(|p| p.text.clone())
        .unwrap_or_default();

    Ok(serde_json::from_str(&text).unwrap_or(json!({
        "overall_summary": "パースエラー",
        "dominant_emotions": [],
        "key_interests": [],
        "personality_overview": "",
        "recommendations": []
    })))
}
