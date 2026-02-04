from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from app.database import get_db
from app.models.todo import Todo
from app.models.user import User
from app.schemas.todo import TodoCreate, TodoUpdate, TodoResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/todos", tags=["todos"])


@router.get("", response_model=List[TodoResponse])
def get_todos(
    target_date: date = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """指定日のTODOリストを取得（デフォルトは今日）"""
    if target_date is None:
        target_date = date.today()

    todos = db.query(Todo).filter(
        Todo.user_id == current_user.id,
        Todo.date == target_date
    ).order_by(Todo.created_at).all()

    return todos


@router.post("", response_model=TodoResponse)
def create_todo(
    todo: TodoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """新しいTODOを作成"""
    db_todo = Todo(
        user_id=current_user.id,
        title=todo.title,
        date=todo.date,
        completed=False
    )
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo


@router.put("/{todo_id}", response_model=TodoResponse)
def update_todo(
    todo_id: int,
    todo: TodoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """TODOを更新"""
    db_todo = db.query(Todo).filter(
        Todo.id == todo_id,
        Todo.user_id == current_user.id
    ).first()

    if not db_todo:
        raise HTTPException(status_code=404, detail="TODO not found")

    if todo.title is not None:
        db_todo.title = todo.title
    if todo.completed is not None:
        db_todo.completed = todo.completed
    if todo.date is not None:
        db_todo.date = todo.date

    db.commit()
    db.refresh(db_todo)
    return db_todo


@router.delete("/{todo_id}")
def delete_todo(
    todo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """TODOを削除"""
    db_todo = db.query(Todo).filter(
        Todo.id == todo_id,
        Todo.user_id == current_user.id
    ).first()

    if not db_todo:
        raise HTTPException(status_code=404, detail="TODO not found")

    db.delete(db_todo)
    db.commit()
    return {"message": "TODO deleted"}
