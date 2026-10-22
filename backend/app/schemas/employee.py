from datetime import date

from pydantic import BaseModel, ConfigDict, Field, field_validator


class EmployeeSearch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    department: str | None = Field(default=None, min_length=1, max_length=100)
    search: str = Field(min_length=1, max_length=150)
    limit: int = Field(default=20, ge=1, le=50)
    cursor: str | None = Field(default=None, min_length=1, max_length=1024)

    @field_validator("search", "department", mode="before")
    @classmethod
    def trim_search(cls, value):
        if isinstance(value, str):
            value = value.strip()
            if not value:
                raise ValueError("Enter an employee name or department.")
            if any(ord(character) < 32 for character in value):
                raise ValueError("Search must not contain control characters.")
        return value


class EmployeeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    department: str
    designation: str
    date_of_joining: date


class EmployeePage(BaseModel):
    items: list[EmployeeRead]
    next_cursor: str | None
    has_more: bool


class ErrorDetail(BaseModel):
    field: str
    message: str


class ErrorResponse(BaseModel):
    message: str
    details: list[ErrorDetail] = []
