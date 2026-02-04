"""Migrate image_url to image_urls JSON array

Revision ID: 003
Revises: 002
Create Date: 2024-01-14

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new image_urls column
    op.add_column('posts', sa.Column('image_urls', sa.JSON(), server_default='[]'))

    # Migrate existing data
    op.execute("""
        UPDATE posts
        SET image_urls = CASE
            WHEN image_url IS NOT NULL AND image_url != '' THEN json_build_array(image_url)
            ELSE '[]'::json
        END
    """)

    # Drop old column
    op.drop_column('posts', 'image_url')


def downgrade() -> None:
    op.add_column('posts', sa.Column('image_url', sa.String(500), nullable=True))

    # Migrate back: take first image URL
    op.execute("""
        UPDATE posts
        SET image_url = CASE
            WHEN image_urls IS NOT NULL AND json_array_length(image_urls) > 0
            THEN image_urls->>0
            ELSE NULL
        END
    """)

    op.drop_column('posts', 'image_urls')
