"""Add owner_id to all major tables for multi-tenant isolation

Revision ID: a2b3c4d5e6f7
Revises: 1194fed87222
Create Date: 2026-07-16 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a2b3c4d5e6f7'
down_revision: Union[str, None] = '1194fed87222'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add owner_id column to all major tables
    for table in ['customers', 'machines', 'expense_categories', 'expenses', 'bills', 'payments']:
        op.add_column(table, sa.Column('owner_id', sa.Uuid(as_uuid=True), nullable=True))
        op.create_foreign_key(
            f'fk_{table}_owner_id_users',
            table, 'users',
            ['owner_id'], ['id'],
        )
        op.create_index(f'ix_{table}_owner_id', table, ['owner_id'])


def downgrade() -> None:
    for table in ['payments', 'bills', 'expenses', 'expense_categories', 'machines', 'customers']:
        op.drop_index(f'ix_{table}_owner_id', table_name=table)
        op.drop_constraint(f'fk_{table}_owner_id_users', table, type_='foreignkey')
        op.drop_column(table, 'owner_id')
