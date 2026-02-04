use chrono::NaiveDate;
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::*;

// Users
pub async fn create_user(pool: &PgPool, email: &str, username: &str, hashed_password: &str) -> Result<User, sqlx::Error> {
    sqlx::query_as::<_, User>(
        r#"INSERT INTO users (id, email, username, hashed_password, is_active, created_at)
           VALUES ($1, $2, $3, $4, true, NOW())
           RETURNING id, email, username, hashed_password, is_active, created_at"#
    )
    .bind(Uuid::new_v4())
    .bind(email)
    .bind(username)
    .bind(hashed_password)
    .fetch_one(pool)
    .await
}

pub async fn get_user_by_email(pool: &PgPool, email: &str) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = $1")
        .bind(email)
        .fetch_optional(pool)
        .await
}

pub async fn get_user_by_id(pool: &PgPool, id: &Uuid) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await
}

// Posts
pub async fn create_post(pool: &PgPool, user_id: &Uuid, title: Option<&str>, content: &str, mood: Option<&str>, image_urls: &[String]) -> Result<Post, sqlx::Error> {
    sqlx::query_as::<_, Post>(
        r#"INSERT INTO posts (id, user_id, title, content, mood, image_urls, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
           RETURNING *"#
    )
    .bind(Uuid::new_v4())
    .bind(user_id)
    .bind(title)
    .bind(content)
    .bind(mood)
    .bind(serde_json::json!(image_urls))
    .fetch_one(pool)
    .await
}

pub async fn get_posts(pool: &PgPool, user_id: &Uuid, page: i32, per_page: i32, search: Option<&str>, date_from: Option<&str>, date_to: Option<&str>) -> Result<(Vec<Post>, i64), sqlx::Error> {
    let offset = (page - 1) * per_page;

    let mut query = String::from("SELECT * FROM posts WHERE user_id = $1");
    let mut count_query = String::from("SELECT COUNT(*) FROM posts WHERE user_id = $1");

    if search.is_some() {
        query.push_str(" AND (title ILIKE $4 OR content ILIKE $4)");
        count_query.push_str(" AND (title ILIKE $4 OR content ILIKE $4)");
    }
    if date_from.is_some() {
        query.push_str(" AND created_at >= $5::timestamp");
        count_query.push_str(" AND created_at >= $5::timestamp");
    }
    if date_to.is_some() {
        query.push_str(" AND created_at <= $6::timestamp");
        count_query.push_str(" AND created_at <= $6::timestamp");
    }

    query.push_str(" ORDER BY created_at DESC LIMIT $2 OFFSET $3");

    let search_pattern = search.map(|s| format!("%{}%", s));

    let posts = sqlx::query_as::<_, Post>(&query)
        .bind(user_id)
        .bind(per_page)
        .bind(offset)
        .bind(&search_pattern)
        .bind(date_from)
        .bind(date_to)
        .fetch_all(pool)
        .await?;

    let total: (i64,) = sqlx::query_as(&count_query)
        .bind(user_id)
        .bind(&search_pattern)
        .bind(date_from)
        .bind(date_to)
        .fetch_one(pool)
        .await?;

    Ok((posts, total.0))
}

pub async fn get_post_by_id(pool: &PgPool, id: &Uuid, user_id: &Uuid) -> Result<Option<Post>, sqlx::Error> {
    sqlx::query_as::<_, Post>("SELECT * FROM posts WHERE id = $1 AND user_id = $2")
        .bind(id)
        .bind(user_id)
        .fetch_optional(pool)
        .await
}

pub async fn update_post(pool: &PgPool, id: &Uuid, user_id: &Uuid, title: Option<&str>, content: Option<&str>, mood: Option<&str>, image_urls: Option<&[String]>) -> Result<Option<Post>, sqlx::Error> {
    let image_urls_json = image_urls.map(|urls| serde_json::json!(urls));

    sqlx::query_as::<_, Post>(
        r#"UPDATE posts SET
           title = COALESCE($3, title),
           content = COALESCE($4, content),
           mood = COALESCE($5, mood),
           image_urls = COALESCE($6, image_urls),
           updated_at = NOW()
           WHERE id = $1 AND user_id = $2
           RETURNING *"#
    )
    .bind(id)
    .bind(user_id)
    .bind(title)
    .bind(content)
    .bind(mood)
    .bind(image_urls_json)
    .fetch_optional(pool)
    .await
}

pub async fn delete_post(pool: &PgPool, id: &Uuid, user_id: &Uuid) -> Result<bool, sqlx::Error> {
    let result = sqlx::query("DELETE FROM posts WHERE id = $1 AND user_id = $2")
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;
    Ok(result.rows_affected() > 0)
}

// Analyses
pub async fn create_analysis(pool: &PgPool, post_id: &Uuid, user_id: &Uuid, result: serde_json::Value, tokens_used: i32, model_version: &str) -> Result<Analysis, sqlx::Error> {
    sqlx::query_as::<_, Analysis>(
        r#"INSERT INTO analyses (id, post_id, user_id, analysis_type, result, tokens_used, model_version, created_at)
           VALUES ($1, $2, $3, 'full', $4, $5, $6, NOW())
           RETURNING *"#
    )
    .bind(Uuid::new_v4())
    .bind(post_id)
    .bind(user_id)
    .bind(result)
    .bind(tokens_used)
    .bind(model_version)
    .fetch_one(pool)
    .await
}

pub async fn get_analysis_by_post(pool: &PgPool, post_id: &Uuid, user_id: &Uuid) -> Result<Option<Analysis>, sqlx::Error> {
    sqlx::query_as::<_, Analysis>("SELECT * FROM analyses WHERE post_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 1")
        .bind(post_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await
}

pub async fn get_user_analyses(pool: &PgPool, user_id: &Uuid, limit: i32) -> Result<Vec<Analysis>, sqlx::Error> {
    sqlx::query_as::<_, Analysis>("SELECT * FROM analyses WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2")
        .bind(user_id)
        .bind(limit)
        .fetch_all(pool)
        .await
}

pub async fn count_user_analyses(pool: &PgPool, user_id: &Uuid) -> Result<i64, sqlx::Error> {
    let result: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM analyses WHERE user_id = $1")
        .bind(user_id)
        .fetch_one(pool)
        .await?;
    Ok(result.0)
}

// Todos
pub async fn get_todos(pool: &PgPool, user_id: &Uuid, date: NaiveDate) -> Result<Vec<Todo>, sqlx::Error> {
    sqlx::query_as::<_, Todo>("SELECT * FROM todos WHERE user_id = $1 AND date = $2 ORDER BY created_at")
        .bind(user_id)
        .bind(date)
        .fetch_all(pool)
        .await
}

pub async fn create_todo(pool: &PgPool, user_id: &Uuid, title: &str, date: NaiveDate) -> Result<Todo, sqlx::Error> {
    sqlx::query_as::<_, Todo>(
        r#"INSERT INTO todos (user_id, title, completed, date, created_at, updated_at)
           VALUES ($1, $2, false, $3, NOW(), NOW())
           RETURNING *"#
    )
    .bind(user_id)
    .bind(title)
    .bind(date)
    .fetch_one(pool)
    .await
}

pub async fn update_todo(pool: &PgPool, id: i32, user_id: &Uuid, title: Option<&str>, completed: Option<bool>, date: Option<NaiveDate>) -> Result<Option<Todo>, sqlx::Error> {
    sqlx::query_as::<_, Todo>(
        r#"UPDATE todos SET
           title = COALESCE($3, title),
           completed = COALESCE($4, completed),
           date = COALESCE($5, date),
           updated_at = NOW()
           WHERE id = $1 AND user_id = $2
           RETURNING *"#
    )
    .bind(id)
    .bind(user_id)
    .bind(title)
    .bind(completed)
    .bind(date)
    .fetch_optional(pool)
    .await
}

pub async fn delete_todo(pool: &PgPool, id: i32, user_id: &Uuid) -> Result<bool, sqlx::Error> {
    let result = sqlx::query("DELETE FROM todos WHERE id = $1 AND user_id = $2")
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;
    Ok(result.rows_affected() > 0)
}
