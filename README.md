# People — Employee Directory

An employee directory built with React, Vite, TypeScript, FastAPI, and MySQL 8.4. Search by name or department, browse employee details, and load another page without losing your current results.

## Run locally

Prerequisites: Python 3.12+, Node.js 22.12+ (Node 24 also works), and Docker Desktop with Compose. Start Docker Desktop before running the database command.

### 1. Configure and start MySQL

Open a terminal in the extracted `employee-directory` folder:

```sh
python configure.py
docker compose up -d --wait
```

The configuration script creates root, backend, and frontend `.env` files with unique local database passwords. It refuses to overwrite existing environment files. The root file configures Docker; the backend file has matching application credentials; the frontend file sets the API base URL. No real credentials are included in this repository.

### 2. Start the backend

Windows PowerShell:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements-dev.txt
.venv\Scripts\python -m alembic upgrade head
.venv\Scripts\python -m scripts.seed
.venv\Scripts\python -m uvicorn app.main:create_app --factory --reload --host 127.0.0.1 --port 8000
```

macOS / Linux:

```sh
cd backend
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python -m alembic upgrade head
.venv/bin/python -m scripts.seed
.venv/bin/python -m uvicorn app.main:create_app --factory --reload --host 127.0.0.1 --port 8000
```

Keep this terminal running. The migration creates the table and indexes. Seeding creates 36 fictional employees with reserved example email addresses; rerunning it preserves existing employees with the same email.

Interactive API documentation: <http://localhost:8000/docs>.

### 3. Start the frontend

Open another terminal in the project root:

```sh
cd frontend
npm ci
npm run dev
```

Open <http://localhost:5173>. Click **Engineering** or search for **Rahul**. Try **Design**, **rah**, and an unmatched name. Clearing the input returns to the start state without requesting the API.

The development server uses a fixed port so the configured CORS origin stays accurate. If you change the port or use `127.0.0.1` in the browser, update `CORS_ORIGINS` in `backend/.env`. Restart the frontend after changing `VITE_API_BASE_URL`.

### Existing MySQL installation

Docker is optional if you already have MySQL 8.0+ running. Copy `backend/.env.example` and `frontend/.env.example` to `.env` in their respective folders. Create the database and an application user with access to that database, then fill in the backend connection fields. Use your own passwords. Run the same migration, seed, and application commands above. MySQL's `utf8mb4_0900_ai_ci` collation is required by this schema; MariaDB is not a drop-in replacement.

The local application user needs schema privileges for Alembic and write privileges for sample-data seeding. A deployed read-only directory can use a separate runtime account granted `SELECT`, with migrations and seeding performed by a separate administrative account.

## Search behavior and API

```http
GET /employees?search=rahul
GET /employees?search=eng&limit=12
GET /employees?search=eng&limit=12&cursor=<next_cursor>
```

`search` is required. Leading and trailing spaces are trimmed; an empty value is rejected. Searches match the **beginning of the full name or department**, case-insensitively. For example, `rah` matches `Rahul Sharma`; `eng` matches `Engineering`. `Sharma` does not match `Rahul Sharma`. This deliberate prefix rule is shown in the UI; substring and surname-token search are outside this implementation. The MySQL collation also makes matching accent-insensitive.

`%`, `_`, and the escape character `!` are treated literally. The maximum search length is 150 characters. `limit` defaults to 20 and must be between 1 and 50. The frontend requests 12 employees per page. Unknown query parameters are rejected.

Example response shape:

```json
{
  "items": [
    {
      "id": 1,
      "name": "Rahul Sharma",
      "email": "rahul.sharma@example.test",
      "department": "Engineering",
      "designation": "Senior Software Engineer",
      "date_of_joining": "2021-01-01"
    }
  ],
  "next_cursor": null,
  "has_more": false
}
```

The example illustrates the shape, not the complete seeded result set. Results have deterministic ascending employee-ID ordering. Treat `next_cursor` as opaque and pass it back with the same trimmed search. A cursor is an encoded position, not an authentication token or secret. Changing the search resets pagination.

| Status | Meaning |
| --- | --- |
| `200` | Results, including an empty list when nothing matches |
| `422` | Missing/blank/oversized search, invalid limit/cursor, or unknown parameter |
| `503` | Database unavailable or pool capacity exceeded; `Retry-After: 5` |
| `500` | Unexpected database error; internal details are not returned |

Errors have a consistent shape:

```json
{
  "message": "Check your search parameters.",
  "details": [{ "field": "query.search", "message": "Enter an employee name or department." }]
}
```

Validation detail wording may also include Pydantic's `Value error` prefix. SQL statements, connection passwords, and stack traces are not sent to the browser.

## Structure and responsibilities

| Location | Responsibility |
| --- | --- |
| `frontend/src/api/` | Fetch client, API URL configuration, employee requests |
| `frontend/src/hooks/` | Debouncing, cancellation, stale-response protection, pagination state |
| `frontend/src/components/` | SearchBar, EmployeeCard, EmployeeList, skeletons, empty state |
| `frontend/src/types/` | Shared frontend response contracts |
| `backend/app/api/routes/` | Validated HTTP contract and service delegation |
| `backend/app/api/dependencies.py` | Compose services and repositories per request |
| `backend/app/api/exception_handlers.py` | Central HTTP error mapping |
| `backend/app/services/` | Search orchestration and cursor rules |
| `backend/app/repositories/` | Parameterized employee queries |
| `backend/app/db/` | Engine, pooled connections, session lifecycle, ORM base |
| `backend/app/models/` | Persistent employee model |
| `backend/app/schemas/` | Request validation and response schemas |
| `backend/migrations/` | Versioned database schema |
| `backend/scripts/` | Idempotent sample-data seeding and query-plan inspection |

Route handlers contain no database queries or business rules. Adding employee creation would introduce a creation schema, service method, repository write method, and route while reusing the existing database session dependency.

## Database design and connection approach

One `employees` table stores the six required fields. It uses an auto-increment `BIGINT` primary key, required bounded strings, a unique email constraint, and a native `DATE` for joining date. Name and department are not unique: different employees can share either. Departments remain a bounded text field because this assignment has no separate department-management workflow; a department table and foreign key would be a natural extension if department records acquire their own metadata.

The schema uses InnoDB and UTF-8 (`utf8mb4`). Two secondary indexes, `(name, id)` and `(department, id)`, support prefix filtering. Email uniqueness is enforced by the database. Alembic migrations create the schema explicitly; starting the web server never silently creates or changes tables.

SQLAlchemy manages one engine per application process and a fresh session per request. Sessions close and return connections to the pool even on errors. The default pool holds five connections and allows five temporary overflow connections; tune this against the database's capacity and multiply by worker count when budgeting total connections. `pool_pre_ping` checks connections before reuse, and recycling retires older connections on checkout. Pool acquisition, connection establishment, and database reads/writes have finite timeouts. Passwords use secret settings and a structured connection URL so special characters are not manually concatenated into a DSN. Parameterized SQL keeps user input separate from query syntax.

The synchronous PyMySQL driver is paired with synchronous FastAPI routes; FastAPI runs these handlers in its thread pool. An async database stack would be another valid choice, but is unnecessary for this assignment's scope.

## Performance decisions and limits

- **350 ms debounce:** typing `Rah` quickly sends one request after the pause. Pauses longer than 350 ms can legitimately produce additional searches.
- **Cancellation and sequence checks:** a new search aborts previous requests; late responses cannot overwrite newer results. Aborting the browser request does not guarantee cancellation of a MySQL query already executing.
- **No blank searches:** the initial/cleared state does not fetch the full directory.
- **No UI-level fetching:** presentational components receive data and callbacks.
- **Prefix filters:** use `LIKE 'rah%'` with escaped literal input and case-insensitive collation, without wrapping indexed columns in `LOWER()`.
- **Two bounded candidate branches:** search name and department separately. Each branch selects at most `limit + 1` employee IDs; a distinct union deduplicates employees matching both. The final query joins back only the selected candidates and returns the six required fields, capped at `limit + 1`. This is one SQL statement and one database round trip.
- **Cursor pagination:** `id > last_id` avoids increasingly deep offsets. One extra result establishes `has_more`; there is no full `COUNT(*)` query per search.
- **Bounded client requests:** a 12-second timeout presents a retryable error if the server stops responding.
- **Controlled pagination:** repeated load-more clicks cannot create duplicate in-flight requests. Pagination errors preserve existing cards and allow retry.
- **Local fonts:** fonts are bundled with the app, with system fallbacks; no runtime font-service requests are needed.

Indexes make prefix range scans possible; they do **not** guarantee constant-time search. The database optimizer chooses the plan. Broad prefixes or many matching employees may still require scanning/sorting many index entries to obtain the next IDs. Branch limits bound intermediate returned candidate sets, not the number of index entries examined. Validate with realistic data and `EXPLAIN`; do not interpret the small sample dataset as a production benchmark. A larger deployment may need a dedicated search index, a revised sort/index strategy, or token search depending on the measured workload.

To inspect the actual MySQL plan, from `backend/` with its virtual environment:

```sh
python -m scripts.explain_search rah
```

Use the virtual environment's Python explicitly if you have not activated it. The inspection script prints `EXPLAIN FORMAT=JSON`; it does not execute a load test. Cursor pages are not a snapshot: concurrent inserts, deletions, or changes to employee search fields may affect later pages.

## Verification

Backend, from `backend/` with the virtual environment active:

```sh
python -m pytest -q
python -m ruff check .
python -m ruff format --check .
```

Windows users can replace `python` with `.venv\Scripts\python`; macOS/Linux users can use `.venv/bin/python` without activating anything.

Frontend, from `frontend/`:

```sh
npm test
npm run lint
npm run build
```

Backend unit/API tests use isolated in-memory SQLite databases for fast feedback. They are not a substitute for MySQL collation or query-plan verification. `tests/test_mysql.py` verifies the migrated indexes, actual MySQL prefix matching, duplicate elimination, and cursor pagination. Set `TEST_DATABASE_URL` to a **dedicated migrated MySQL test database** and rerun pytest to enable it; otherwise that test is skipped. It uses a transaction and rolls back its temporary rows.

```powershell
$env:TEST_DATABASE_URL = "mysql+pymysql://USER:URL_ENCODED_PASSWORD@127.0.0.1:3306/TEST_DATABASE?charset=utf8mb4"
.venv\Scripts\python -m pytest -q
```

Frontend tests cover debouncing, cancellation, ignored stale responses, retry, pagination failure, duplicate pagination prevention, and search controls. `VALIDATION.md` records checks actually performed on the delivered project.

Manual review: search Rahul; click Engineering; load the next page; search a nonexistent name; clear the search; stop MySQL and try a new search; restart MySQL and retry. Check the layout at desktop and mobile widths and use Tab to navigate controls. `/` focuses search when you are not already typing in an input.

## Troubleshooting and submission

- **Database port occupied:** change `MYSQL_PORT` in root `.env` and `DB_PORT` in `backend/.env` to the same free port.
- **Access denied after changing Docker passwords:** MySQL initializes users only when the data volume is first created. Update credentials in the existing database rather than only editing `.env`.
- **Missing environment configuration:** run `configure.py` before starting the backend. For manual setup, copy the relevant `.env.example` files. Environment files are ignored by Git.
- **Frontend cannot reach API:** check the backend is running, `VITE_API_BASE_URL` is correct, and the browser origin is in `CORS_ORIGINS`.
- **Stop database:** run `docker compose stop`. This preserves employee data. `docker compose down` removes containers but preserves the named data volume.

For submission, push `frontend/`, `backend/`, `compose.yaml`, `configure.py`, the README, validation notes, and lockfiles to your GitHub repository. Exclude `.env`, virtual environments, `node_modules`, build output, and test caches. `npm ci` reproduces the frontend dependency tree; backend direct dependencies are version-pinned in the requirements files.

This is the requested internal search tool. Authentication, employee creation, profile editing, and production deployment are outside the assignment scope. Before exposing a real employee directory publicly, add access control and deploy with appropriate transport and network configuration.
