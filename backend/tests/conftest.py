import os
from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings
from app.db.base import Base
from app.db.session import get_session
from app.main import create_app
from app.models.employee import Employee


@pytest.fixture
def session():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        session.add_all(
            [
                Employee(
                    name="Rahul Sharma",
                    email="rahul@example.test",
                    department="Engineering",
                    designation="Engineer",
                    date_of_joining=date(2023, 1, 1),
                ),
                Employee(
                    name="Aisha Khan",
                    email="aisha@example.test",
                    department="Engineering",
                    designation="Engineer",
                    date_of_joining=date(2024, 2, 1),
                ),
                Employee(
                    name="Rahul Verma",
                    email="verma@example.test",
                    department="Design",
                    designation="Designer",
                    date_of_joining=date(2022, 3, 1),
                ),
                Employee(
                    name="Engineering Partner",
                    email="partner@example.test",
                    department="Engineering",
                    designation="Lead",
                    date_of_joining=date(2021, 1, 1),
                ),
                Employee(
                    name="100% Real",
                    email="percent@example.test",
                    department="Research_One",
                    designation="Analyst",
                    date_of_joining=date(2020, 1, 1),
                ),
            ]
        )
        session.commit()
        yield session
    engine.dispose()


@pytest.fixture
def client(session, monkeypatch):
    values = {
        "DB_HOST": "unused",
        "DB_NAME": "unused",
        "DB_USER": "unused",
        "DB_PASSWORD": "test-only",
        "CORS_ORIGINS": '["http://localhost:5173"]',
    }
    for name, value in values.items():
        monkeypatch.setenv(name, value)
    get_settings.cache_clear()
    app = create_app()
    app.dependency_overrides[get_session] = lambda: session
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client
    get_settings.cache_clear()


@pytest.fixture
def mysql_engine():
    url = os.environ.get("TEST_DATABASE_URL")
    if not url:
        pytest.skip("Set TEST_DATABASE_URL to a dedicated migrated MySQL test database.")
    engine = create_engine(url, hide_parameters=True)
    if engine.dialect.name != "mysql":
        raise ValueError("The integration test requires MySQL.")
    yield engine
    engine.dispose()
