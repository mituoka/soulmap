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

pub async fn create_analysis(
    State(state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
    Json(req): Json<CreateAnalysisRequest>,
) -> Result<Json<Analysis>, (StatusCode, String)> {
    let user_id = extract_user_id(&headers, &state.jwt_secret)?;

    // Get the post
    let post = db::get_post_by_id(&state.db, &req.post_id, &user_id)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Post not found".to_string()))?;

    // Call AI API
    let (result, tokens) = ai::analyze_post(
        &state.gemini_api_key,
        post.title.as_deref(),
        &post.content,
    )
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Save analysis
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

pub async fn get_user_summary(
    State(state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
) -> Result<Json<UserSummary>, (StatusCode, String)> {
    let user_id = extract_user_id(&headers, &state.jwt_secret)?;

    let analyses = db::get_user_analyses(&state.db, &user_id, 10)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let total = db::count_user_analyses(&state.db, &user_id)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Generate summary text from analyses
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
