//! AIチャット機能
//!
//! ユーザーとAIの会話を通じて日記作成を支援する機能を提供します。
//! - chat: AIとの会話エンドポイント
//! - summarize: 会話内容から日記を生成するエンドポイント

use axum::{
    extract::State,
    http::{header, StatusCode},
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::{auth::verify_token, AppState};

/// チャットメッセージの構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,  // "user" または "assistant"
    pub content: String,
}

/// チャットリクエスト（会話履歴を含む）
#[derive(Debug, Deserialize)]
pub struct ChatRequest {
    pub messages: Vec<ChatMessage>,
}

/// チャットレスポンス
#[derive(Debug, Serialize)]
pub struct ChatResponse {
    pub message: ChatMessage,
    /// 4回以上のやり取り後にtrueになり、「日記にする」ボタンを表示
    pub should_summarize: bool,
}

/// 要約リクエスト（会話全体を渡す）
#[derive(Debug, Deserialize)]
pub struct SummarizeRequest {
    pub messages: Vec<ChatMessage>,
}

/// 要約レスポンス（日記のタイトルと本文）
#[derive(Debug, Serialize)]
pub struct SummarizeResponse {
    pub title: String,
    pub content: String,
}

/// AIアシスタントへのシステムプロンプト
/// 日記作成を支援するための性格と振る舞いを定義
const SYSTEM_PROMPT: &str = r#"あなたは日記作成を手伝うフレンドリーなAIアシスタントです。
ユーザーの今日の出来事や気持ちを引き出すために、優しく質問してください。

ガイドライン:
- 短く親しみやすい言葉で話してください
- 一度に1つの質問だけしてください
- ユーザーの回答に共感を示してください
- 3-5回のやり取りで十分な情報を集めてください
- 深掘りしすぎず、自然な会話を心がけてください
- 会話の終盤（4回目以降）では、「投稿に添付する画像はありますか？」と聞いてください

最初の質問は「今日はどんな一日でしたか？」から始めてください。"#;

/// 会話内容を日記に変換するためのプロンプト
/// JSON形式でタイトルと本文を出力させる
const SUMMARIZE_PROMPT: &str = r#"以下の会話内容を元に、日記の投稿を作成してください。

会話内容:
{conversation}

以下のJSON形式で出力してください:
{{
  "title": "日記のタイトル（10-20文字程度）",
  "content": "日記の本文（ユーザーの視点で、です・ます調で、200-400文字程度）"
}}

注意:
- ユーザーが話した内容を元に、一人称で書いてください
- 感情や気持ちも含めて自然な日記にしてください
- 会話で出てきた具体的なエピソードを含めてください
- JSONのみを出力し、他のテキストは含めないでください"#;

/// JWTトークンからユーザーIDを抽出する
fn extract_user_id(headers: &axum::http::HeaderMap, jwt_secret: &str) -> Result<Uuid, (StatusCode, String)> {
    let auth_header = headers
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .ok_or((StatusCode::UNAUTHORIZED, "Missing authorization".to_string()))?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or((StatusCode::UNAUTHORIZED, "Invalid token".to_string()))?;

    let claims = verify_token(token, jwt_secret)
        .map_err(|_| (StatusCode::UNAUTHORIZED, "Invalid token".to_string()))?;

    Uuid::parse_str(&claims.sub)
        .map_err(|_| (StatusCode::UNAUTHORIZED, "Invalid user id".to_string()))
}

/// AIとの会話エンドポイント
///
/// ユーザーのメッセージに対してAIが応答を返す。
/// 4回以上のやり取り後は should_summarize が true になる。
pub async fn chat(
    State(state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
    Json(req): Json<ChatRequest>,
) -> Result<Json<ChatResponse>, (StatusCode, String)> {
    let _user_id = extract_user_id(&headers, &state.jwt_secret)?;

    if state.gemini_api_key.is_empty() {
        return Err((StatusCode::SERVICE_UNAVAILABLE, "Gemini API key not configured".to_string()));
    }

    // Gemini API用に会話履歴を組み立てる
    let mut conversation_text = format!("System: {}\n\n", SYSTEM_PROMPT);
    for msg in &req.messages {
        let role = if msg.role == "user" { "User" } else { "Assistant" };
        conversation_text.push_str(&format!("{}: {}\n", role, msg.content));
    }
    conversation_text.push_str("\nAssistant: ");

    let response = call_gemini_chat(&state.gemini_api_key, &conversation_text).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // ユーザーのメッセージが4回以上になったら「日記にする」ボタンを有効化
    let user_message_count = req.messages.iter().filter(|m| m.role == "user").count();
    let should_summarize = user_message_count >= 4;

    Ok(Json(ChatResponse {
        message: ChatMessage {
            role: "assistant".to_string(),
            content: response,
        },
        should_summarize,
    }))
}

/// 会話内容を日記に要約するエンドポイント
///
/// AIとの会話履歴を受け取り、日記のタイトルと本文を生成して返す。
pub async fn summarize(
    State(state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
    Json(req): Json<SummarizeRequest>,
) -> Result<Json<SummarizeResponse>, (StatusCode, String)> {
    let _user_id = extract_user_id(&headers, &state.jwt_secret)?;

    if state.gemini_api_key.is_empty() {
        return Err((StatusCode::SERVICE_UNAVAILABLE, "Gemini API key not configured".to_string()));
    }

    // 会話履歴をテキスト形式に変換
    let mut conversation_text = String::new();
    for msg in &req.messages {
        let role = if msg.role == "user" { "ユーザー" } else { "AI" };
        conversation_text.push_str(&format!("{}: {}\n", role, msg.content));
    }

    let prompt = SUMMARIZE_PROMPT.replace("{conversation}", &conversation_text);
    let response = call_gemini_json(&state.gemini_api_key, &prompt).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // AIからのJSON応答をパース
    let parsed: serde_json::Value = serde_json::from_str(&response)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("JSON parse error: {}", e)))?;

    let title = parsed["title"].as_str().unwrap_or("今日の日記").to_string();
    let content = parsed["content"].as_str().unwrap_or("").to_string();

    Ok(Json(SummarizeResponse { title, content }))
}

/// Gemini APIを呼び出してテキスト応答を取得する
async fn call_gemini_chat(api_key: &str, prompt: &str) -> Result<String, anyhow::Error> {
    let client = reqwest::Client::new();
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={}",
        api_key
    );

    let request_body = serde_json::json!({
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "temperature": 0.9,
            "maxOutputTokens": 500
        }
    });

    let response = client.post(&url).json(&request_body).send().await?;

    if !response.status().is_success() {
        let error_text = response.text().await?;

        // レート制限エラーをわかりやすいメッセージに変換
        if error_text.contains("429") || error_text.contains("RESOURCE_EXHAUSTED") {
            return Err(anyhow::anyhow!(
                "AI APIのレート制限に達しました。しばらく時間をおいてから再度お試しください。（毎日午前9時にリセットされます）"
            ));
        }

        return Err(anyhow::anyhow!("AI APIでエラーが発生しました"));
    }

    let json: serde_json::Value = response.json().await?;
    let text = json["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .unwrap_or("")
        .to_string();

    Ok(text)
}

/// Gemini APIを呼び出してJSON形式の応答を取得する
async fn call_gemini_json(api_key: &str, prompt: &str) -> Result<String, anyhow::Error> {
    let client = reqwest::Client::new();
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={}",
        api_key
    );

    let request_body = serde_json::json!({
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 1000,
            "responseMimeType": "application/json"
        }
    });

    let response = client.post(&url).json(&request_body).send().await?;

    if !response.status().is_success() {
        let error_text = response.text().await?;

        // レート制限エラーをわかりやすいメッセージに変換
        if error_text.contains("429") || error_text.contains("RESOURCE_EXHAUSTED") {
            return Err(anyhow::anyhow!(
                "AI APIのレート制限に達しました。しばらく時間をおいてから再度お試しください。（毎日午前9時にリセットされます）"
            ));
        }

        return Err(anyhow::anyhow!("AI APIでエラーが発生しました"));
    }

    let json: serde_json::Value = response.json().await?;
    let text = json["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .unwrap_or("{}")
        .to_string();

    Ok(text)
}
