import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import InterfaceError, OperationalError, SQLAlchemyError
from sqlalchemy.exc import TimeoutError as PoolTimeoutError

from app.core.errors import InvalidCursorError

logger = logging.getLogger(__name__)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def validation_error(request: Request, exc: RequestValidationError):
        details = [
            {"field": ".".join(str(part) for part in error["loc"]), "message": error["msg"]}
            for error in exc.errors()
        ]
        return JSONResponse(
            status_code=422,
            content={"message": "Check your search parameters.", "details": details},
        )

    @app.exception_handler(InvalidCursorError)
    async def invalid_cursor(request: Request, exc: InvalidCursorError):
        return JSONResponse(status_code=422, content={"message": str(exc), "details": []})

    @app.exception_handler(OperationalError)
    @app.exception_handler(InterfaceError)
    @app.exception_handler(PoolTimeoutError)
    async def database_unavailable(request: Request, exc: Exception):
        logger.error("Database request failed: %s", type(exc).__name__)
        return JSONResponse(
            status_code=503,
            content={
                "message": "Employee search is temporarily unavailable. Please try again.",
                "details": [],
            },
            headers={"Retry-After": "5"},
        )

    @app.exception_handler(SQLAlchemyError)
    async def database_error(request: Request, exc: SQLAlchemyError):
        logger.error("Unexpected database error: %s", type(exc).__name__)
        return JSONResponse(
            status_code=500,
            content={"message": "Unable to complete your search.", "details": []},
        )
