# Validation record

Verified on 21 October 2026 using Python 3.12.14, Node.js 24.19.0, MySQL Community Server 8.4.7, and Chrome for Testing 145.0.7632.117.

| Check | Result |
| --- | --- |
| Backend API, repository, validation, and MySQL integration tests | 34 passed |
| Frontend API client, search hook, and component tests | 14 passed |
| Backend Ruff lint and formatting | Passed |
| Python dependency compatibility (`pip check`) | Passed |
| Frontend ESLint | Passed |
| TypeScript compilation and Vite production build | Passed |
| Alembic schema migration on MySQL | Passed |
| Repeated sample-data seeding on MySQL | Passed; no duplicate employee emails |
| MySQL search query-plan inspection | Both prefix branches used their corresponding secondary indexes for `rah` |
| Browser search with the actual FastAPI/MySQL backend | Passed |
| Desktop and mobile visual inspection | Completed |

Browser checks covered the initial state without a search request, debouncing rapid typing into one request, searching by name and department, loading 12 then 16 Engineering employees, no-result messaging, clearing search, the `/` shortcut, mobile horizontal overflow, visible loading, a simulated HTTP 503 response, and successful retry against the real backend. Desktop was checked at 1440 px width and mobile at 390 px width.

The search tests also cover escaped SQL wildcards, injection-like input, deduplication when both fields match, malformed/query-mismatched cursors, response field selection, maximum-length Unicode queries with pagination, and sanitized database connection errors.

The MySQL integration test runs against a separate migrated database and rolls back temporary rows. The regular API tests use SQLite. With no `TEST_DATABASE_URL`, the default backend run reports 33 passed and 1 skipped; enabling the documented MySQL test reports all 34 passed.

The test environment emitted a Starlette deprecation warning about its HTTPX test adapter. It did not affect the passing checks.

Limits: no production-sized load test was performed. Index use was inspected on the sample data and is not a latency guarantee. Docker was unavailable in the verification environment, so the Compose startup command itself was not executed; migrations, credentials, seeding, and API behavior were exercised with a locally launched MySQL 8.4 server. This record does not claim deployment or authentication testing.
