mod api;
mod auth;
mod db;
mod models;
mod ai;

use axum::{
    routing::{get, post, put, delete},
    Router,
};
use sqlx::postgres::PgPoolOptions;
use std::sync::Arc;
use tower_http::cors::{CorsLayer, Any};
use tower_http::services::ServeDir;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

pub struct AppState {
    pub db: sqlx::PgPool,
    pub jwt_secret: String,
    pub gemini_api_key: String,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://soulmap:soulmap123@localhost:5432/soulmap_db".to_string());

    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&database_url)
        .await?;

    tracing::info!("Connected to database");
    tokio::fs::create_dir_all("uploads").await?;

    let state = Arc::new(AppState {
        db: pool,
        jwt_secret: std::env::var("JWT_SECRET_KEY").unwrap_or_else(|_| "secret".to_string()),
        gemini_api_key: std::env::var("GEMINI_API_KEY").unwrap_or_default(),
    });

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/health", get(|| async { axum::Json(serde_json::json!({"status": "healthy"})) }))
        .route("/api/v1/auth/register", post(api::auth::register))
        .route("/api/v1/auth/login", post(api::auth::login))
        .route("/api/v1/auth/me", get(api::auth::me))
        .route("/api/v1/posts", get(api::posts::list_posts))
        .route("/api/v1/posts", post(api::posts::create_post))
        .route("/api/v1/posts/:id", get(api::posts::get_post))
        .route("/api/v1/posts/:id", put(api::posts::update_post))
        .route("/api/v1/posts/:id", delete(api::posts::delete_post))
        .route("/api/v1/analyses/create", post(api::analyses::create_analysis))
        .route("/api/v1/analyses/post/:post_id", get(api::analyses::get_analysis))
        .route("/api/v1/analyses/user/summary", get(api::analyses::get_user_summary))
        .route("/api/v1/uploads/image", post(api::uploads::upload_image))
        .route("/api/v1/todos", get(api::todos::list_todos))
        .route("/api/v1/todos", post(api::todos::create_todo))
        .route("/api/v1/todos/:id", put(api::todos::update_todo))
        .route("/api/v1/todos/:id", delete(api::todos::delete_todo))
        .route("/api/v1/settings/models", get(api::settings::get_models))
        .route("/api/v1/chat/message", post(api::chat::chat))
        .route("/api/v1/chat/summarize", post(api::chat::summarize))
        .nest_service("/uploads", ServeDir::new("uploads"))
        .layer(cors)
        .with_state(state);

    let addr = "0.0.0.0:8000";
    tracing::info!("Server running on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
