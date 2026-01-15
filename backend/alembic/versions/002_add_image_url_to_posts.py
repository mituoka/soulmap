"""Add image_url to posts

Revision ID: 002
Revises: 001
Create Date: 2024-01-13

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('posts', sa.Column('image_url', sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column('posts', 'image_url')
