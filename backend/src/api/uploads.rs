use axum::{
    extract::{Multipart, State},
    http::{header, StatusCode},
    Json,
};
use std::sync::Arc;
use uuid::Uuid;

use crate::{auth::verify_token, AppState};

pub async fn upload_image(
    State(state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
    mut multipart: Multipart,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    // Verify auth
    let auth_header = headers
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .ok_or((StatusCode::UNAUTHORIZED, "Missing authorization".to_string()))?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or((StatusCode::UNAUTHORIZED, "Invalid token".to_string()))?;

    verify_token(token, &state.jwt_secret)
        .map_err(|_| (StatusCode::UNAUTHORIZED, "Invalid token".to_string()))?;

    // Process upload
    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?
    {
        let name = field.name().unwrap_or("").to_string();
        if name != "file" {
            continue;
        }

        let filename = field
            .file_name()
            .map(|s| s.to_string())
            .unwrap_or_else(|| "upload".to_string());

        let content_type = field
            .content_type()
            .map(|s| s.to_string())
            .unwrap_or_else(|| "application/octet-stream".to_string());

        // Validate content type
        if !content_type.starts_with("image/") {
            return Err((StatusCode::BAD_REQUEST, "Only image files are allowed".to_string()));
        }

        let data = field
            .bytes()
            .await
            .map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;

        // Generate unique filename
        let ext = filename
            .rsplit('.')
            .next()
            .unwrap_or("jpg");
        let new_filename = format!("{}.{}", Uuid::new_v4(), ext);
        let path = format!("uploads/{}", new_filename);

        // Save file
        tokio::fs::write(&path, &data)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        let url = format!("/uploads/{}", new_filename);

        return Ok(Json(serde_json::json!({
            "url": url,
            "filename": new_filename
        })));
    }

    Err((StatusCode::BAD_REQUEST, "No file provided".to_string()))
}
