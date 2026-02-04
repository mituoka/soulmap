"""Add todos table

Revision ID: 004
Revises: 003
Create Date: 2025-02-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'todos',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('completed', sa.Boolean(), default=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_todos_user_date', 'todos', ['user_id', 'date'])


def downgrade() -> None:
    op.drop_index('ix_todos_user_date')
    op.drop_table('todos')
