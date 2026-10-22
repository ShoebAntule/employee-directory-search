import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "employees",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("email", sa.String(254), nullable=False),
        sa.Column("department", sa.String(100), nullable=False),
        sa.Column("designation", sa.String(150), nullable=False),
        sa.Column("date_of_joining", sa.Date(), nullable=False),
        sa.UniqueConstraint("email", name="uq_employees_email"),
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
    )
    op.create_index("ix_employees_name_id", "employees", ["name", "id"])
    op.create_index("ix_employees_department_id", "employees", ["department", "id"])


def downgrade():
    op.drop_table("employees")
