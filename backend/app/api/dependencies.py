from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import get_session
from app.repositories.employee import EmployeeRepository
from app.services.employee import EmployeeService


def get_employee_service(session: Annotated[Session, Depends(get_session)]) -> EmployeeService:
    return EmployeeService(EmployeeRepository(session))
