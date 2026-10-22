import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  Building2,
  Code2,
  Headphones,
  HeartHandshake,
  Landmark,
  Layers3,
  LoaderCircle,
  Megaphone,
  Palette,
  RotateCcw,
  UsersRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { EmptyState } from "./components/EmptyState";
import { EmployeeList, EmployeeSkeletons } from "./components/EmployeeList";
import { SearchBar } from "./components/SearchBar";
import { useEmployeeSearch } from "./hooks/useEmployeeSearch";

const departments = [
  { name: "Engineering", icon: Code2 },
  { name: "Design", icon: Palette },
  { name: "Product", icon: Layers3 },
  { name: "People", icon: HeartHandshake },
  { name: "Marketing", icon: Megaphone },
  { name: "Finance", icon: Landmark },
  { name: "Customer Success", icon: Headphones },
];

export default function App() {
  const [search, setSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    null,
  );
  const directory = useEmployeeSearch(search, selectedDepartment);
  const query = search.trim();
  const busy = directory.status === "waiting" || directory.status === "loading";
  const hasFilters = Boolean(query || selectedDepartment);

  function clearFilters() {
    setSearch("");
    setSelectedDepartment(null);
  }

  return (
    <div className="workspace-shell">
      <a className="skip-link" href="#directory">
        Skip to directory
      </a>
      <aside className="sidebar" aria-label="Directory filters">
        <a className="brand" href="/" aria-label="Roster directory home">
          <span className="brand-symbol">
            <UsersRound size={24} strokeWidth={1.7} />
          </span>
          <span>
            roster<span className="brand-dot">/</span>
            <small>THE PEOPLE WORKSPACE</small>
          </span>
        </a>
        <div className="workspace-label">
          <span className="workspace-square">
            <Building2 size={17} />
          </span>
          <span>
            Employee workspace<small>Internal directory</small>
          </span>
        </div>
        <div className="sidebar-label">
          <span>DEPARTMENTS</span>
          <span>{departments.length}</span>
        </div>
        <div className="team-filters">
          <button
            className={`team-button ${selectedDepartment === null ? "is-active" : ""}`}
            aria-pressed={selectedDepartment === null}
            onClick={() => setSelectedDepartment(null)}
          >
            <UsersRound size={18} aria-hidden="true" />
            <span>All departments</span>
            <span className="selection-marker" />
          </button>
          {departments.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`team-button ${selectedDepartment === name ? "is-active" : ""}`}
              aria-pressed={selectedDepartment === name}
              onClick={() =>
                setSelectedDepartment((current) =>
                  current === name ? null : name,
                )
              }
            >
              <Icon size={18} aria-hidden="true" />
              <span>{name}</span>
              <span className="selection-marker" />
            </button>
          ))}
        </div>
        <div className="sidebar-note">
          <div className="note-rule" />
          <span>
            LESS SEARCHING.
            <br />
            MORE CONNECTING.
          </span>
          <p>
            The people behind
            <br />
            the work, in one place.
          </p>
          <div className="keyboard-tip">
            <kbd>/</kbd>
            <span>Jump to search</span>
          </div>
        </div>
        <div className="sidebar-footer">
          <span className="footer-symbol">r/</span>
          <span>A space for your team.</span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>Workspace</span>
            <span className="breadcrumb-slash">/</span>
            <strong>Directory</strong>
          </div>
          <span className="topbar-label">PEOPLE & CONNECTIONS</span>
        </header>
        <main id="directory" className="directory-main">
          <section className="page-intro" aria-labelledby="page-title">
            <div>
              <div className="eyebrow">
                <span />
                THE TEAM, AT A GLANCE
              </div>
              <h1 id="page-title">
                Employee directory<span>.</span>
              </h1>
              <p>Find a teammate. See their role. Get in touch.</p>
            </div>
            <button
              className="reset-button"
              onClick={clearFilters}
              disabled={!hasFilters}
            >
              <RotateCcw size={16} aria-hidden="true" />
              Clear filters
            </button>
          </section>
          <section className="search-panel" aria-label="Employee search">
            <div className="search-panel-top">
              <span className="field-label">WHO ARE YOU LOOKING FOR?</span>
              <span className="search-shortcut">
                Press <kbd>/</kbd> to focus
              </span>
            </div>
            <SearchBar value={search} onChange={setSearch} />
            <div className="search-panel-bottom">
              <p id="search-help">
                Search the beginning of a name, email, or department.
              </p>
              {selectedDepartment ? (
                <button
                  className="active-filter"
                  onClick={() => setSelectedDepartment(null)}
                  aria-label="Remove department filter"
                >
                  <span>Within {selectedDepartment}</span>
                  <X size={13} aria-hidden="true" />
                </button>
              ) : (
                <span className="search-scope">
                  <Building2 size={13} aria-hidden="true" />
                  Across all departments
                </span>
              )}
            </div>
          </section>
          <section className="results-panel" aria-labelledby="results-title">
            <div className="results-toolbar">
              <div className="results-title-group">
                <span className="results-symbol">
                  <UsersRound size={18} aria-hidden="true" />
                </span>
                <h2 id="results-title">
                  {hasFilters ? "Matching people" : "People directory"}
                </h2>
                {directory.status === "success" && (
                  <span className="result-count">
                    {directory.items.length}
                    {directory.has_more ? "+" : ""}
                  </span>
                )}
              </div>
              <div className="result-status" role="status" aria-live="polite">
                {busy ? (
                  <>
                    <LoaderCircle
                      size={14}
                      className="spin"
                      aria-hidden="true"
                    />
                    {directory.status === "waiting"
                      ? "Waiting for typing to pause"
                      : "Searching directory"}
                  </>
                ) : directory.status === "success" ? (
                  `${directory.items.length} ${directory.items.length === 1 ? "person" : "people"} loaded`
                ) : (
                  "YOUR NEXT CONNECTION STARTS HERE"
                )}
              </div>
            </div>
            <div className="results-body" aria-busy={busy}>
              {busy && <EmployeeSkeletons />}
              {directory.status === "idle" && <EmptyState />}
              {directory.status === "error" && (
                <div className="error-state" role="alert">
                  <span className="error-icon">
                    <AlertCircle size={28} />
                  </span>
                  <h3>The directory is taking a break.</h3>
                  <p>{directory.error}</p>
                  <button className="primary-button" onClick={directory.retry}>
                    Try again
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}
              {directory.status === "success" &&
                (directory.items.length ? (
                  <EmployeeList employees={directory.items} />
                ) : (
                  <EmptyState
                    query={query || selectedDepartment || undefined}
                  />
                ))}
            </div>
            {directory.pageError && (
              <p className="page-error" role="alert">
                {directory.pageError}
              </p>
            )}
            {directory.status === "success" && directory.has_more && (
              <div className="pagination-footer">
                <span>There are more people to discover.</span>
                <button
                  className="primary-button"
                  disabled={directory.loadingMore}
                  onClick={directory.loadMore}
                >
                  {directory.loadingMore ? (
                    <LoaderCircle size={15} className="spin" />
                  ) : (
                    <ArrowDown size={15} />
                  )}
                  {directory.loadingMore
                    ? "Loading people…"
                    : directory.pageError
                      ? "Try loading more again"
                      : "Load more people"}
                </button>
              </div>
            )}
          </section>
          <footer className="main-footer">
            <span>Different roles. Shared purpose.</span>
            <span>
              roster<span className="brand-dot">/</span>
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
