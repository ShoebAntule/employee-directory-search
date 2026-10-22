import base64
import json
from datetime import date

import pytest
from sqlalchemy.dialects import mysql
from sqlalchemy.exc import OperationalError

from app.api.dependencies import get_employee_service
from app.models.employee import Employee
from app.repositories.employee import EmployeeRepository
from app.services.employee import EmployeeService


def test_search_name_is_trimmed_and_case_insensitive(client):
    response = client.get("/employees", params={"search": "  rAhUl  "})
    assert response.status_code == 200
    assert [item["name"] for item in response.json()["items"]] == ["Rahul Sharma", "Rahul Verma"]


def test_department_and_name_matches_are_not_duplicated(client):
    response = client.get("/employees", params={"search": "eng"})
    assert [row["id"] for row in response.json()["items"]] == [1, 2, 4]


def test_cursor_pages_are_ordered_and_complete(client):
    items = []
    cursor = None
    while True:
        params = {"search": "Eng", "limit": 1}
        if cursor:
            params["cursor"] = cursor
        response = client.get("/employees", params=params)
        assert response.status_code == 200
        page = response.json()
        items.extend(row["id"] for row in page["items"])
        assert page["has_more"] == (page["next_cursor"] is not None)
        cursor = page["next_cursor"]
        if not cursor:
            break
    assert items == [1, 2, 4]


@pytest.mark.parametrize(
    "params",
    [
        {},
        {"search": ""},
        {"search": "   "},
        {"search": "a" * 151},
        {"search": "rah", "limit": 0},
        {"search": "rah", "limit": 51},
        {"search": "rah", "limit": "abc"},
        {"search": "rah", "unknown": "x"},
        {"search": "rah", "cursor": "garbage"},
        {"search": "rah", "cursor": ""},
        {"search": "ra\x00h"},
    ],
)
def test_invalid_queries_return_meaningful_errors(client, params):
    response = client.get("/employees", params=params)
    assert response.status_code == 422
    assert response.json()["message"]
    assert "traceback" not in response.text.lower()


def test_cursor_cannot_be_reused_for_a_different_query(client):
    cursor = client.get("/employees", params={"search": "Eng", "limit": 1}).json()["next_cursor"]
    assert client.get("/employees", params={"search": "Rah", "cursor": cursor}).status_code == 422


@pytest.mark.parametrize("employee_id", [True, -1, 0, "1", 2**63])
def test_invalid_cursor_ids(client, employee_id):
    cursor = base64.urlsafe_b64encode(
        json.dumps({"id": employee_id, "search": "rah"}).encode()
    ).decode()
    assert client.get("/employees", params={"search": "rah", "cursor": cursor}).status_code == 422


@pytest.mark.parametrize(
    ("query", "expected"),
    [("100%", [5]), ("Research_", [5]), ("%", []), ("_", []), ("' OR 1=1 --", []), ("hul", [])],
)
def test_prefix_search_escapes_wildcards_and_injection(client, query, expected):
    response = client.get("/employees", params={"search": query})
    assert response.status_code == 200
    assert [item["id"] for item in response.json()["items"]] == expected


def test_no_matches_returns_empty_page(client):
    assert client.get("/employees", params={"search": "missing"}).json() == {
        "items": [],
        "has_more": False,
        "next_cursor": None,
    }


def test_database_failure_is_sanitized(client):
    class FailingRepository:
        def search(self, *args):
            raise OperationalError("SELECT secret", {}, Exception("password=private"))

    client.app.dependency_overrides[get_employee_service] = lambda: EmployeeService(
        FailingRepository()
    )
    response = client.get("/employees", params={"search": "Rah"})
    assert response.status_code == 503
    assert response.headers["Retry-After"] == "5"
    assert "private" not in response.text and "SELECT" not in response.text


def test_cors_only_allows_configured_origin(client):
    good = client.get("/employees?search=rah", headers={"Origin": "http://localhost:5173"})
    bad = client.get("/employees?search=rah", headers={"Origin": "https://untrusted.example"})
    assert good.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert "access-control-allow-origin" not in bad.headers


def test_response_contains_only_contract_fields(client):
    row = client.get("/employees?search=rah").json()["items"][0]
    assert set(row) == {"id", "name", "email", "department", "designation", "date_of_joining"}


def test_more_than_default_page_is_bounded(client, session):
    session.add_all(
        [
            Employee(
                name=f"Extra {i}",
                email=f"extra{i}@example.test",
                department="Engineering",
                designation="Engineer",
                date_of_joining=date(2024, 1, 1),
            )
            for i in range(60)
        ]
    )
    session.commit()
    page = client.get("/employees?search=Eng").json()
    assert len(page["items"]) == 20
    assert page["has_more"] is True


def test_query_is_parameterized_for_mysql():
    statement = EmployeeRepository.search_statement("O'Reilly%", 0, 21)
    compiled = statement.compile(dialect=mysql.dialect())
    assert "O'Reilly" not in str(compiled)
    assert "O'Reilly!%%" in compiled.params.values()
    assert "UNION" in str(compiled)
    assert "OFFSET" not in str(compiled)


def test_maximum_unicode_search_can_be_paginated(client, session):
    name = "界" * 150
    session.add_all(
        [
            Employee(
                name=name,
                email=f"unicode{i}@example.test",
                department="Design",
                designation="Designer",
                date_of_joining=date(2024, 1, 1),
            )
            for i in range(2)
        ]
    )
    session.commit()
    first = client.get("/employees", params={"search": name, "limit": 1}).json()
    assert len(first["next_cursor"]) <= 1024
    second = client.get(
        "/employees", params={"search": name, "limit": 1, "cursor": first["next_cursor"]}
    )
    assert second.status_code == 200
    assert len(second.json()["items"]) == 1
    assert second.json()["has_more"] is False
