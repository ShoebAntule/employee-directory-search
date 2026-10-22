from datetime import date
from uuid import uuid4

from sqlalchemy import inspect
from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.repositories.employee import EmployeeRepository
from app.schemas.employee import EmployeeSearch
from app.services.employee import EmployeeService


def test_mysql_migration_search_collation_and_pagination(mysql_engine):
    inspector = inspect(mysql_engine)
    assert {"ix_employees_name_id", "ix_employees_department_id"} <= {
        index["name"] for index in inspector.get_indexes("employees")
    }
    prefix = "Test" + uuid4().hex[:10]
    with Session(mysql_engine) as session:
        session.add_all(
            [
                Employee(
                    name=f"{prefix} {i}",
                    email=f"{prefix}{i}@example.test",
                    department=f"{prefix} Team" if i == 0 else "Integration",
                    designation="Engineer",
                    date_of_joining=date(2024, 1, 1),
                )
                for i in range(3)
            ]
        )
        session.flush()
        service = EmployeeService(EmployeeRepository(session))
        first = service.search(EmployeeSearch(search=prefix.lower(), limit=2))
        assert len(first.items) == 2 and first.has_more
        second = service.search(
            EmployeeSearch(search=prefix.lower(), limit=2, cursor=first.next_cursor)
        )
        assert len(second.items) == 1 and not second.has_more
        assert len({item.id for item in first.items + second.items}) == 3
        session.rollback()
