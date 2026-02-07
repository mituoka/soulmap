//! 日記分析API
//!
//! 投稿をAIで分析し、感情・性格傾向・関心事などを抽出する機能を提供。
//! - create_analysis: 投稿を分析してDBに保存
//! - get_analysis: 分析結果を取得
//! - get_user_summary: ユーザー全体の傾向サマリーを生成（AI呼び出しあり）

use axum::{
    extract::{Path, State},
    http::{header, StatusCode},
    Json,
};
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    ai,
    auth::verify_token,
    db,
    models::{Analysis, CreateAnalysisRequest, UserSummary},
    AppState,
};

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

/// 投稿を分析するエンドポイント
///
/// 指定された投稿をGemini AIで分析し、結果をDBに保存する。
/// 分析内容: 感情スコア、トピック、性格傾向、関心事、サマリー
pub async fn create_analysis(
    State(state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
    Json(req): Json<CreateAnalysisRequest>,
) -> Result<Json<Analysis>, (StatusCode, String)> {
    let user_id = extract_user_id(&headers, &state.jwt_secret)?;

    // 投稿を取得
    let post = db::get_post_by_id(&state.db, &req.post_id, &user_id)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Post not found".to_string()))?;

    // Gemini AIで投稿を分析
    let (result, tokens) = ai::analyze_post(
        &state.gemini_api_key,
        post.title.as_deref(),
        &post.content,
    )
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 分析結果をDBに保存
    let analysis = db::create_analysis(
        &state.db,
        &req.post_id,
        &user_id,
        result,
        tokens,
        "gemini-flash-latest",
    )
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(analysis))
}

/// 投稿の分析結果を取得するエンドポイント
///
/// DBから保存済みの分析結果を取得する（AI呼び出しなし）
pub async fn get_analysis(
    State(state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
    Path(post_id): Path<Uuid>,
) -> Result<Json<Analysis>, (StatusCode, String)> {
    let user_id = extract_user_id(&headers, &state.jwt_secret)?;

    let analysis = db::get_analysis_by_post(&state.db, &post_id, &user_id)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Analysis not found".to_string()))?;

    Ok(Json(analysis))
}

/// ユーザーの分析サマリーを生成するエンドポイント
///
/// 直近10件の分析結果を基に、AIで全体的な傾向サマリーを生成する。
/// 注意: このエンドポイントはAI APIを呼び出すため、Analysisページでのみ使用。
/// ダッシュボードでは呼び出さない（レート制限対策）
pub async fn get_user_summary(
    State(state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
) -> Result<Json<UserSummary>, (StatusCode, String)> {
    let user_id = extract_user_id(&headers, &state.jwt_secret)?;

    // 直近10件の分析結果を取得
    let analyses = db::get_user_analyses(&state.db, &user_id, 10)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 分析総数を取得
    let total = db::count_user_analyses(&state.db, &user_id)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 各分析のサマリーを結合してAIに渡すテキストを作成
    let analyses_text: String = analyses
        .iter()
        .filter_map(|a| {
            a.result.get("summary").and_then(|s| s.as_str()).map(|s| s.to_string())
        })
        .collect::<Vec<_>>()
        .join("\n- ");

    let summary = ai::generate_user_summary(&state.gemini_api_key, &analyses_text)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(UserSummary {
        user_id,
        total_posts_analyzed: total,
        summary,
    }))
}
