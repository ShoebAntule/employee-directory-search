from sqlalchemy import select, union
from sqlalchemy.orm import Session

from app.models.employee import Employee


class EmployeeRepository:
    def __init__(self, session: Session):
        self.session = session

    @staticmethod
    def search_statement(
        search: str,
        after_id: int,
        limit: int,
        department: str | None = None,
    ):
        pattern = (
            search.replace("!", "!!")
            .replace("%", "!%")
            .replace("_", "!_")
            + "%"
        )

        candidates = []

        for column in (Employee.name, Employee.department, Employee.email):
            statement = select(Employee.id).where(
                Employee.id > after_id,
                column.like(pattern, escape="!"),
            )

            if department is not None:
                statement = statement.where(Employee.department == department)

            branch = statement.order_by(Employee.id).limit(limit).subquery()
            candidates.append(select(branch.c.id))

        matches = union(*candidates).subquery()

        return (
            select(
                Employee.id,
                Employee.name,
                Employee.email,
                Employee.department,
                Employee.designation,
                Employee.date_of_joining,
            )
            .join(matches, Employee.id == matches.c.id)
            .order_by(Employee.id)
            .limit(limit)
        )

    def search(
        self,
        search: str,
        after_id: int,
        limit: int,
        department: str | None = None,
    ):
        statement = self.search_statement(search, after_id, limit, department)
        return self.session.execute(statement).mappings().all()