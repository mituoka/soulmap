use axum::{
    extract::{Path, Query, State},
    http::{header, StatusCode},
    Json,
};
use chrono::NaiveDate;
use serde::Deserialize;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    auth::verify_token,
    db,
    models::{CreateTodoRequest, Todo, UpdateTodoRequest},
    AppState,
};

#[derive(Debug, Deserialize)]
pub struct ListParams {
    target_date: Option<NaiveDate>,
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

pub async fn list_todos(
    State(state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
    Query(params): Query<ListParams>,
) -> Result<Json<Vec<Todo>>, (StatusCode, String)> {
    let user_id = extract_user_id(&headers, &state.jwt_secret)?;

    let date = params.target_date.unwrap_or_else(|| chrono::Local::now().date_naive());

    let todos = db::get_todos(&state.db, &user_id, date)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(todos))
}

pub async fn create_todo(
    State(state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
    Json(req): Json<CreateTodoRequest>,
) -> Result<Json<Todo>, (StatusCode, String)> {
    let user_id = extract_user_id(&headers, &state.jwt_secret)?;

    let todo = db::create_todo(&state.db, &user_id, &req.title, req.date)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(todo))
}

pub async fn update_todo(
    State(state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
    Path(id): Path<i32>,
    Json(req): Json<UpdateTodoRequest>,
) -> Result<Json<Todo>, (StatusCode, String)> {
    let user_id = extract_user_id(&headers, &state.jwt_secret)?;

    let todo = db::update_todo(
        &state.db,
        id,
        &user_id,
        req.title.as_deref(),
        req.completed,
        req.date,
    )
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Todo not found".to_string()))?;

    Ok(Json(todo))
}

pub async fn delete_todo(
    State(state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
    Path(id): Path<i32>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let user_id = extract_user_id(&headers, &state.jwt_secret)?;

    let deleted = db::delete_todo(&state.db, id, &user_id)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if !deleted {
        return Err((StatusCode::NOT_FOUND, "Todo not found".to_string()));
    }

    Ok(Json(serde_json::json!({"message": "Todo deleted"})))
}
