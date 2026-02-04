use axum::{extract::State, Json};
use serde::Serialize;
use std::sync::Arc;

use crate::AppState;

#[derive(Debug, Serialize)]
pub struct Model {
    id: String,
    name: String,
    provider: String,
    description: String,
}

#[derive(Debug, Serialize)]
pub struct ModelsResponse {
    models: Vec<Model>,
    current: String,
}

pub async fn get_models(
    State(state): State<Arc<AppState>>,
) -> Json<ModelsResponse> {
    let mut models = Vec::new();

    if !state.gemini_api_key.is_empty() {
        models.push(Model {
            id: "gemini-flash-latest".to_string(),
            name: "Gemini Flash".to_string(),
            provider: "google".to_string(),
            description: "高速・無料".to_string(),
        });
    }

    Json(ModelsResponse {
        models,
        current: "gemini-flash-latest".to_string(),
    })
}
