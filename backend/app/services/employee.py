import base64
import binascii
import json
from hashlib import sha256

from app.core.errors import InvalidCursorError
from app.repositories.employee import EmployeeRepository
from app.schemas.employee import EmployeePage, EmployeeRead, EmployeeSearch


class EmployeeService:
    def __init__(self, repository: EmployeeRepository):
        self.repository = repository

    def search(self, query: EmployeeSearch) -> EmployeePage:
        cursor_key = sha256(
            json.dumps(
                [query.search, query.department],
                ensure_ascii=False,
            ).encode()
        ).hexdigest()

        after_id = (
            self._decode_cursor(query.cursor, cursor_key)
            if query.cursor
            else 0
        )

        rows = self.repository.search(
            query.search,
            after_id,
            query.limit + 1,
            query.department,
        )

        has_more = len(rows) > query.limit
        items = [
            EmployeeRead.model_validate(row)
            for row in rows[:query.limit]
        ]

        next_cursor = (
            self._encode_cursor(items[-1].id, cursor_key)
            if has_more
            else None
        )

        return EmployeePage(
            items=items,
            next_cursor=next_cursor,
            has_more=has_more,
        )

    @staticmethod
    def _encode_cursor(employee_id: int, search: str) -> str:
        value = json.dumps(
            {"id": employee_id, "search": search},
            separators=(",", ":"),
            ensure_ascii=False,
        )
        return base64.urlsafe_b64encode(value.encode()).decode().rstrip("=")

    @staticmethod
    def _decode_cursor(cursor: str, search: str) -> int:
        try:
            raw = base64.b64decode(
                cursor + "=" * (-len(cursor) % 4),
                altchars=b"-_",
                validate=True,
            )
            value = json.loads(raw)

            if (
                not isinstance(value, dict)
                or set(value) != {"id", "search"}
                or type(value["id"]) is not int
                or not 0 < value["id"] <= 9223372036854775807
                or value["search"] != search
            ):
                raise ValueError

            return value["id"]
        except (
            ValueError,
            KeyError,
            TypeError,
            UnicodeDecodeError,
            binascii.Error,
        ) as exc:
            raise InvalidCursorError(
                "Invalid cursor. Start a new search."
            ) from exc