use axum::{
    extract::{Path, Query, State},
    http::{header, StatusCode},
    Json,
};
use serde::Deserialize;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    auth::verify_token,
    db,
    models::{CreatePostRequest, Post, PostListResponse, UpdatePostRequest},
    AppState,
};

#[derive(Debug, Deserialize)]
pub struct ListParams {
    page: Option<i32>,
    per_page: Option<i32>,
    search: Option<String>,
    date_from: Option<String>,
    date_to: Option<String>,
}

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

pub async fn list_posts(
    State(state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
    Query(params): Query<ListParams>,
) -> Result<Json<PostListResponse>, (StatusCode, String)> {
    let user_id = extract_user_id(&headers, &state.jwt_secret)?;

    let page = params.page.unwrap_or(1);
    let per_page = params.per_page.unwrap_or(10);

    let (posts, total) = db::get_posts(
        &state.db,
        &user_id,
        page,
        per_page,
        params.search.as_deref(),
        params.date_from.as_deref(),
        params.date_to.as_deref(),
    )
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(PostListResponse {
        posts,
        total,
        page,
        per_page,
    }))
}

pub async fn create_post(
    State(state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
    Json(req): Json<CreatePostRequest>,
) -> Result<Json<Post>, (StatusCode, String)> {
    let user_id = extract_user_id(&headers, &state.jwt_secret)?;

    let image_urls = req.image_urls.unwrap_or_default();

    let post = db::create_post(
        &state.db,
        &user_id,
        req.title.as_deref(),
        &req.content,
        req.mood.as_deref(),
        &image_urls,
    )
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(post))
}

pub async fn get_post(
    State(state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<Json<Post>, (StatusCode, String)> {
    let user_id = extract_user_id(&headers, &state.jwt_secret)?;

    let post = db::get_post_by_id(&state.db, &id, &user_id)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Post not found".to_string()))?;

    Ok(Json(post))
}

pub async fn update_post(
    State(state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdatePostRequest>,
) -> Result<Json<Post>, (StatusCode, String)> {
    let user_id = extract_user_id(&headers, &state.jwt_secret)?;

    let post = db::update_post(
        &state.db,
        &id,
        &user_id,
        req.title.as_deref(),
        req.content.as_deref(),
        req.mood.as_deref(),
        req.image_urls.as_deref(),
    )
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Post not found".to_string()))?;

    Ok(Json(post))
}

pub async fn delete_post(
    State(state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let user_id = extract_user_id(&headers, &state.jwt_secret)?;

    let deleted = db::delete_post(&state.db, &id, &user_id)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if !deleted {
        return Err((StatusCode::NOT_FOUND, "Post not found".to_string()));
    }

    Ok(Json(serde_json::json!({"message": "Post deleted"})))
}
