from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.database import get_db
from app.models.user import User
from app.models.post import Post
from app.models.analysis import Analysis
from app.schemas.analysis import AnalysisCreate, AnalysisResponse, UserSummaryResponse
from app.core.security import get_current_user
from app.core.ai_service import analyze_post, generate_user_summary

router = APIRouter()


@router.post("/create", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
async def create_analysis(
    data: AnalysisCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """投稿のAI分析を実行"""
    # 投稿の存在確認
    post = db.query(Post).filter(
        Post.id == data.post_id,
        Post.user_id == current_user.id,
        Post.deleted_at.is_(None)
    ).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # AI分析実行
    analysis_result = await analyze_post(
        title=post.title,
        content=post.content,
        mood=post.mood
    )

    # 結果を保存
    analysis = Analysis(
        post_id=post.id,
        user_id=current_user.id,
        analysis_type="personality",
        result=analysis_result["result"],
        tokens_used=analysis_result["tokens_used"],
        model_version=analysis_result["model_version"]
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return analysis


@router.get("/post/{post_id}", response_model=AnalysisResponse)
async def get_post_analysis(
    post_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """投稿の分析結果を取得"""
    analysis = db.query(Analysis).filter(
        Analysis.post_id == post_id,
        Analysis.user_id == current_user.id
    ).order_by(Analysis.created_at.desc()).first()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return analysis


@router.get("/user/summary", response_model=UserSummaryResponse)
async def get_user_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ユーザー全体の分析サマリーを取得"""
    analyses = db.query(Analysis).filter(
        Analysis.user_id == current_user.id
    ).order_by(Analysis.created_at.desc()).limit(20).all()

    summary = await generate_user_summary(analyses)

    return UserSummaryResponse(
        user_id=str(current_user.id),
        total_posts_analyzed=len(analyses),
        summary=summary
    )
