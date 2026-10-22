from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_employee_service
from app.schemas.employee import EmployeePage, EmployeeSearch, ErrorResponse
from app.services.employee import EmployeeService

router = APIRouter(tags=["Employees"])


@router.get(
    "/employees",
    response_model=EmployeePage,
    responses={422: {"model": ErrorResponse}, 503: {"model": ErrorResponse}},
    summary="Search employees by name or department prefix",
)
def search_employees(
    query: Annotated[EmployeeSearch, Query()],
    service: Annotated[EmployeeService, Depends(get_employee_service)],
) -> EmployeePage:
    return service.search(query)
