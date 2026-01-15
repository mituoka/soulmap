from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime
from app.database import get_db
from app.models.user import User
from app.models.post import Post
from app.schemas.post import PostCreate, PostUpdate, PostResponse, PostListResponse
from app.core.security import get_current_user

router = APIRouter()


@router.get("/", response_model=PostListResponse)
async def get_posts(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """投稿一覧取得"""
    offset = (page - 1) * per_page
    query = db.query(Post).filter(
        Post.user_id == current_user.id,
        Post.deleted_at.is_(None)
    ).order_by(Post.created_at.desc())

    total = query.count()
    posts = query.offset(offset).limit(per_page).all()

    return PostListResponse(
        posts=posts,
        total=total,
        page=page,
        per_page=per_page
    )


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """投稿詳細取得"""
    post = db.query(Post).filter(
        Post.id == post_id,
        Post.user_id == current_user.id,
        Post.deleted_at.is_(None)
    ).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.post("/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_data: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """投稿作成"""
    post = Post(
        user_id=current_user.id,
        title=post_data.title,
        content=post_data.content,
        mood=post_data.mood,
        image_url=post_data.image_url
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: UUID,
    post_data: PostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """投稿更新"""
    post = db.query(Post).filter(
        Post.id == post_id,
        Post.user_id == current_user.id,
        Post.deleted_at.is_(None)
    ).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    update_data = post_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(post, key, value)

    db.commit()
    db.refresh(post)
    return post


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """投稿削除（論理削除）"""
    post = db.query(Post).filter(
        Post.id == post_id,
        Post.user_id == current_user.id,
        Post.deleted_at.is_(None)
    ).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    post.deleted_at = datetime.utcnow()
    db.commit()
