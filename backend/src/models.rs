use chrono::{NaiveDate, NaiveDateTime};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    #[serde(skip_serializing)]
    pub hashed_password: String,
    pub is_active: Option<bool>,
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct Post {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: Option<String>,
    pub content: String,
    pub mood: Option<String>,
    pub image_urls: serde_json::Value,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct Analysis {
    pub id: Uuid,
    pub post_id: Uuid,
    pub user_id: Uuid,
    pub analysis_type: String,
    pub result: serde_json::Value,
    pub tokens_used: Option<i32>,
    pub model_version: Option<String>,
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct Todo {
    pub id: i32,
    pub user_id: Uuid,
    pub title: String,
    pub completed: bool,
    pub date: NaiveDate,
    pub created_at: Option<NaiveDateTime>,
}

// Request/Response DTOs
#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub username: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub access_token: String,
    pub token_type: String,
}

#[derive(Debug, Deserialize)]
pub struct CreatePostRequest {
    pub title: Option<String>,
    pub content: String,
    pub mood: Option<String>,
    pub image_urls: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePostRequest {
    pub title: Option<String>,
    pub content: Option<String>,
    pub mood: Option<String>,
    pub image_urls: Option<Vec<String>>,
}

#[derive(Debug, Serialize)]
pub struct PostListResponse {
    pub posts: Vec<Post>,
    pub total: i64,
    pub page: i32,
    pub per_page: i32,
}

#[derive(Debug, Deserialize)]
pub struct CreateAnalysisRequest {
    pub post_id: Uuid,
}

#[derive(Debug, Deserialize)]
pub struct CreateTodoRequest {
    pub title: String,
    pub date: NaiveDate,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTodoRequest {
    pub title: Option<String>,
    pub completed: Option<bool>,
    pub date: Option<NaiveDate>,
}

#[derive(Debug, Serialize)]
pub struct UserSummary {
    pub user_id: Uuid,
    pub total_posts_analyzed: i64,
    pub summary: serde_json::Value,
}
