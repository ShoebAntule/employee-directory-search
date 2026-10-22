import { Mail, RotateCcw, LoaderCircle, ArrowDown } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "./components/EmptyState";
import { EmployeeList, EmployeeSkeletons } from "./components/EmployeeList";
import { SearchBar } from "./components/SearchBar";
import { useEmployeeSearch } from "./hooks/useEmployeeSearch";

const departments = [
  "Engineering",
  "Design",
  "Product",
  "People",
  "Marketing",
  "Finance",
  "Customer Success",
];

export default function App() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<string | null>(null);
  const directory = useEmployeeSearch(search, department);
  const query = search.trim();
  const busy = directory.status === "waiting" || directory.status === "loading";
  const hasFilters = Boolean(query || department);

  function clearFilters() {
    setSearch("");
    setDepartment(null);
  }

  return (
    <div className="directory-shell">
      <a className="skip-link" href="#directory">
        Skip to directory
      </a>
      <header className="site-header">
        <a className="wordmark" href="/">
          people index<span>.</span>
        </a>
        <span className="header-caption">Employee directory</span>
      </header>
      <main id="directory">
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">Our people</p>
          <h1 id="page-title">Good work starts with people.</h1>
          <p className="intro-copy">
            Find a colleague, explore a team, and put a name to the work.
          </p>
        </section>
        <section className="search-section" aria-label="Employee search">
          <div className="search-controls">
            <div className="search-field">
              <label className="field-label" htmlFor="employee-search">
                Name, email or department
              </label>
              <SearchBar value={search} onChange={setSearch} />
            </div>
            <div className="department-field">
              <label className="field-label" htmlFor="department">
                Department
              </label>
              <select
                id="department"
                value={department ?? ""}
                onChange={(event) => setDepartment(event.target.value || null)}
              >
                <option value="">All departments</option>
                {departments.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="search-details">
            <p id="search-help">
              Matches the beginning of a name, email or department.
            </p>
            <button
              className="text-button"
              onClick={clearFilters}
              disabled={!hasFilters}
            >
              <RotateCcw size={13} aria-hidden="true" />
              Clear filters
            </button>
          </div>
          <div className="department-filters" aria-label="Browse departments">
            <button
              className={
                department === null
                  ? "department-chip selected"
                  : "department-chip"
              }
              aria-pressed={department === null}
              onClick={() => setDepartment(null)}
            >
              All departments
            </button>
            {departments.map((name) => (
              <button
                key={name}
                className={
                  department === name
                    ? "department-chip selected"
                    : "department-chip"
                }
                aria-pressed={department === name}
                onClick={() =>
                  setDepartment((current) => (current === name ? null : name))
                }
              >
                {name}
              </button>
            ))}
          </div>
        </section>
        <section
          className="results-section"
          aria-labelledby="results-heading"
          aria-busy={busy}
        >
          <div className="results-toolbar">
            <h2 id="results-heading">
              {directory.status === "success" ? (
                <>
                  {directory.items.length}
                  {directory.has_more ? "+" : ""}{" "}
                  {directory.items.length === 1 ? "result" : "results"}
                  {query && (
                    <>
                      {" "}
                      for <span>“{query}”</span>
                    </>
                  )}
                </>
              ) : (
                "People directory"
              )}
            </h2>
            <span className="results-context" role="status">
              {busy ? (
                <>
                  <LoaderCircle size={14} className="spin" aria-hidden="true" />
                  Searching…
                </>
              ) : (
                (department ?? "All departments")
              )}
            </span>
          </div>
          <div className="results-surface">
            {busy && <EmployeeSkeletons />}
            {directory.status === "idle" && <EmptyState />}
            {directory.status === "error" && (
              <div className="empty-state" role="alert">
                <h3>Unable to load employees.</h3>
                <p>{directory.error}</p>
                <button className="primary-button" onClick={directory.retry}>
                  Try again
                </button>
              </div>
            )}
            {directory.status === "success" &&
              (directory.items.length ? (
                <EmployeeList employees={directory.items} />
              ) : (
                <EmptyState query={query || department || undefined} />
              ))}
          </div>
          {directory.pageError && (
            <p className="page-error" role="alert">
              {directory.pageError}
            </p>
          )}
          {directory.status === "success" && (
            <div className="results-footer">
              <p>
                Showing {directory.items.length}{" "}
                {directory.items.length === 1 ? "employee" : "employees"}
                {directory.has_more ? " · More results available" : ""}
              </p>
              {directory.has_more && (
                <button
                  className="primary-button"
                  disabled={directory.loadingMore}
                  onClick={directory.loadMore}
                >
                  {directory.loadingMore ? (
                    <LoaderCircle
                      size={15}
                      className="spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <ArrowDown size={15} aria-hidden="true" />
                  )}
                  {directory.loadingMore
                    ? "Loading…"
                    : directory.pageError
                      ? "Try loading more again"
                      : "Load more"}
                </button>
              )}
            </div>
          )}
        </section>
      </main>
      <footer className="site-footer">
        <span>people index.</span>
        <span>
          <Mail size={13} aria-hidden="true" />A directory for staying
          connected.
        </span>
      </footer>
    </div>
  );
}
