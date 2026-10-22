# Employee Directory Search

A small internal tool for finding employees and viewing their details. It addresses a common need within a company: finding a colleague by name or department without manually going through the full employee list.

Users can enter a name or department and see matching employee cards. The application also supports email search and a separate team filter. For example, searching for `Rahul` and selecting Engineering shows matching employees from that department while keeping the search text in place.

## What the application does

- Searches employees by the beginning of their name, email, or department.
- Filters results by a selected department without replacing the typed search.
- Shows each employee's ID, name, email, department, designation, and joining date.
- Displays loading, empty-result, and error states, with a retry option when a request fails.
- Loads results in pages instead of fetching the entire directory.

The frontend provides the search interface, the FastAPI backend validates requests and retrieves matching records, and MySQL stores the employee data. The included sample records are fictional and can be used to run the project locally.

## Stack

- Frontend: React, Vite, TypeScript, and CSS
- Backend: Python and FastAPI
- Database: MySQL 8.4
- Database access: SQLAlchemy with PyMySQL
- Migrations: Alembic
- Tests: Vitest, React Testing Library, and pytest

Docker Compose runs the MySQL server locally. The frontend and backend run separately on the host machine. Docker is optional if MySQL is already installed.

## Running the project

### Prerequisites

- Python 3.12 or newer
- Node.js 22.12 or newer and npm
- Docker Desktop with Docker Compose, if using the included database setup
- A recent browser that supports `AbortSignal.any()` and `AbortSignal.timeout()`

### 1. Get the source

```sh
git clone https://github.com/ShoebAntule/employee-directory-search.git
cd employee-directory-search
```

If using a downloaded ZIP, extract it and open the folder containing `frontend/`, `backend/`, and `compose.yaml`.

### 2. Configure the environment and start MySQL

Start Docker Desktop, then run these commands from the project root:

```sh
python configure.py
docker compose up -d --wait
```

On macOS or Linux, use `python3 configure.py` if `python` is unavailable.

The configuration script creates three files:

| File | Purpose |
| --- | --- |
| `.env` | Database name, user, passwords, and exposed port for Docker Compose |
| `backend/.env` | Database connection, connection pool settings, and allowed frontend origins |
| `frontend/.env` | Backend API base URL |

It generates matching application passwords for Docker and the backend, plus a separate root password. Existing `.env` files are never overwritten. For an existing setup, edit those files directly instead of rerunning the script.

Only `.env.example` templates belong in Git. Actual `.env` files are ignored.

### 3. Start the backend

From the project root, open a terminal and use the commands for your operating system.

**Windows PowerShell**

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements-dev.txt
.\.venv\Scripts\python -m alembic upgrade head
.\.venv\Scripts\python -m scripts.seed
.\.venv\Scripts\python -m uvicorn app.main:create_app --factory --reload --host 127.0.0.1 --port 8000
```

**macOS / Linux**

```sh
cd backend
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python -m alembic upgrade head
.venv/bin/python -m scripts.seed
.venv/bin/python -m uvicorn app.main:create_app --factory --reload --host 127.0.0.1 --port 8000
```

Alembic creates the employee table and indexes. The seed command adds 36 fictional employees. It can be rerun without duplicating existing email addresses.

Keep the terminal running. API documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 4. Start the frontend

Open another terminal in the project root:

```sh
cd frontend
npm ci
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

The API address comes from `VITE_API_BASE_URL` in `frontend/.env`. Restart Vite after changing it. The backend allows the origins listed in `CORS_ORIGINS`; the default is `http://localhost:5173`. If using a different hostname or port in the browser, update that setting and restart the backend.

### Using an existing MySQL server

Use MySQL 8.0 or newer. Create the `employee_directory` database and an application user with access to it. Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env`, then fill in the connection settings. Skip Docker and run the same backend migration, seed, and startup commands above.

The schema uses MySQL's `utf8mb4_0900_ai_ci` collation, so these instructions do not apply unchanged to MariaDB. Migrations need schema permissions, and seeding needs write permissions. The application does not need to connect as root.

## Search behavior

- Search matches the beginning of a name, email, or department.
- MySQL matching is case-insensitive and accent-insensitive under the configured collation.
- `rah` can match `Rahul Sharma`, and `eng` can match `Engineering`.
- Selecting a team keeps the typed search text and restricts matches to that department.
- Clicking the selected team again removes the department filter.
- Selecting a team with an empty input shows that team's employees. The hook sends the team name as the search term along with the department filter.
- Clearing the input keeps a selected team active. Clearing the text and deselecting the team returns to the initial state without a request.
- Results load 12 employees at a time. The load-more button retrieves the next page.

This is prefix search, not a search for text anywhere in a field. `Sharma` alone does not match `Rahul Sharma`, and `example.test` alone does not match `rahul.sharma@example.test`. The team shortcuts are defined in the frontend; they are not loaded from a departments API.

## API

```http
GET /employees?search=rahul
GET /employees?search=rahul.sharma
GET /employees?search=rahul&department=Engineering&limit=12
GET /employees?search=Engineering&department=Engineering&limit=12
GET /employees?search=rahul&department=Engineering&limit=12&cursor=<next_cursor>
```

| Parameter | Rules |
| --- | --- |
| `search` | Required; trimmed, non-empty, maximum 150 characters |
| `department` | Optional; trimmed, non-empty when supplied, maximum 100 characters; equality filter under the database collation |
| `limit` | Defaults to 20; allowed range is 1 to 50 |
| `cursor` | Optional continuation token from the previous response |

The API still requires `search` when a department is supplied. The frontend handles department-only browsing using the fallback described above. Unknown parameters and control characters in search/filter values are rejected. The characters `%`, `_`, and `!` are treated literally rather than as user-supplied SQL wildcards.

A successful response contains `items`, `has_more`, and `next_cursor`. Each item includes the six employee fields. Results are ordered by ascending employee ID. Use the returned cursor with the same search and department; changing either starts a new search. The cursor contains a position and a fingerprint of the search/filter values. It is not an authentication token or a signed value.

| Status | Meaning |
| --- | --- |
| `200` | Search completed; no matches returns an empty `items` list |
| `422` | Invalid or missing search parameters, or an invalid cursor |
| `503` | Database unavailable or connection pool timeout; includes `Retry-After: 5` |
| `500` | Unexpected database error |

Handled errors return a `message` and a `details` list. Database credentials and SQL errors are not returned to the frontend.

## Database choice and connection handling

I chose MySQL because employee records have a fixed structure and benefit from database constraints and indexes. The table uses InnoDB, an auto-increment primary key, a unique email address, and a native date column for the joining date.

| Column | Type | Constraint |
| --- | --- | --- |
| `id` | BIGINT | Primary key, auto-increment |
| `name` | VARCHAR(150) | Required |
| `email` | VARCHAR(254) | Required, unique |
| `department` | VARCHAR(100) | Required |
| `designation` | VARCHAR(150) | Required |
| `date_of_joining` | DATE | Required |

Indexes on `(name, id)` and `(department, id)` support the corresponding search branches. The unique email constraint also creates an index for email lookups. Departments remain a text field because this application does not manage separate department records.

SQLAlchemy keeps a connection pool instead of opening a new database connection for every request. Each request gets its own session, which is closed afterward. The default pool has five connections and allows five additional connections during a burst. These limits, the pool timeout, and connection recycling are configurable in `backend/.env`.

Connections are checked before reuse. Connection establishment and database reads/writes have timeouts. Credentials come from environment settings, and SQLAlchemy builds the connection URL without manually concatenating the password. User input is passed as query parameters. The synchronous PyMySQL driver is used with synchronous FastAPI route handlers.

## Search performance

The frontend waits 350 ms after typing before sending a request. New searches cancel the previous request, and sequence checks prevent an older response from replacing newer results. A client timeout reports an error if a request takes too long. Aborting a browser request does not necessarily stop a database query already running.

The backend uses prefix matching rather than a leading-wildcard query. It searches name, department, and email in three branches. Each branch selects at most `limit + 1` candidate IDs, with the selected department applied before pagination. A distinct union removes duplicates, and the final query fetches the six required fields for the bounded result set in one SQL statement.

Pagination uses `id > last_id` instead of an increasingly large offset. One extra result determines whether another page exists, so there is no full count query for each search. Repeated load-more clicks are guarded, and a failed page request preserves the employees already displayed.

Indexes make range scans possible, but broad prefixes can still scan or sort many matching entries. The candidate limits do not cap every internal database operation. Performance at a larger employee count should be checked with realistic data and a query plan.

From `backend/`, inspect the unfiltered search plan with:

```powershell
.\.venv\Scripts\python -m scripts.explain_search rah
```

On macOS/Linux, use `.venv/bin/python` instead. This command runs `EXPLAIN FORMAT=JSON`; it is not a load test and does not currently accept a department-filter argument. Cursor pagination does not provide a snapshot if employee records change between requests.

## Code organization

| Folder | Responsibility |
| --- | --- |
| `frontend/src/components/` | Search input, employee cards, lists, and display states |
| `frontend/src/hooks/` | Debounce, cancellation, search state, and pagination |
| `frontend/src/api/` | HTTP requests and API configuration |
| `frontend/src/types/` | Frontend response types |
| `backend/app/api/` | Routes, dependencies, and HTTP error handlers |
| `backend/app/services/` | Search orchestration and cursor rules |
| `backend/app/repositories/` | Employee database queries |
| `backend/app/db/` | Engine, connection pool, and session lifecycle |
| `backend/app/models/` | Database model |
| `backend/app/schemas/` | Request validation and response schemas |
| `backend/migrations/` | Versioned schema changes |
| `backend/scripts/` | Sample data and query-plan inspection |

Routes validate requests and delegate to the service. Database queries stay in the repository. Adding employee creation later would involve a request schema, service and repository methods, and a route using the existing session dependency.

## Checks

From `frontend/`:

```sh
npm test
npm run lint
npm run build
```

From `backend/` on Windows:

```powershell
.\.venv\Scripts\python -m pytest -q
.\.venv\Scripts\python -m ruff check .
.\.venv\Scripts\python -m ruff format --check .
```

On macOS/Linux, replace `.\.venv\Scripts\python` with `.venv/bin/python`.

The regular backend tests use isolated SQLite databases. The MySQL integration test is skipped unless `TEST_DATABASE_URL` points to a separate MySQL test database whose schema has already been migrated. It rolls back its temporary rows. Passing the SQLite tests alone does not verify MySQL collation or query plans.

For a manual check, search `Rahul`, select Engineering without changing the text, search an email prefix, load another page of Engineering employees, and change teams. Also check no matches, clearing text while a team remains selected, and deselecting the team. Stop MySQL and try a new search to check the error message; start it again and retry.

## Troubleshooting

- If port 3306 is occupied, change `MYSQL_PORT` in the root `.env` and `DB_PORT` in `backend/.env` to the same free port.
- If port 5173 is occupied, free it or update the frontend port and backend CORS configuration together.
- If the frontend cannot reach the API, check `VITE_API_BASE_URL`, the backend process, and `CORS_ORIGINS`.
- If Docker reports access denied after changing passwords, remember that MySQL initializes users when its data volume is first created. Editing `.env` does not update an existing MySQL user's password.
- `docker compose stop` stops MySQL while keeping its data. Run `docker compose up -d --wait` to start it again.

The application covers employee search and viewing. Login, employee creation/editing, and production hosting are outside its current scope.
