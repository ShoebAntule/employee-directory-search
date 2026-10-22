import {
  AlertCircle,
  ArrowDown,
  ArrowUpRight,
  Building2,
  Check,
  ChevronRight,
  LoaderCircle,
  UsersRound,
} from "lucide-react";
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
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const directory = useEmployeeSearch(search, selectedDepartment);
  const busy = directory.status === "loading" || directory.status === "waiting";
  const query = search.trim();

  return (
    <div className="app-shell">
      <a className="skip-link" href="#directory">
        Skip to directory
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="/" aria-label="People directory home">
            <span className="brand-mark">
              <UsersRound size={23} strokeWidth={1.8} />
            </span>
            <span>
              people<span className="brand-period">.</span>
            </span>
          </a>
          <span className="header-divider" />
          <span className="active-nav">
            <UsersRound size={16} aria-hidden="true" />
            Employee directory
          </span>
          <div className="workspace">
            <Building2 size={16} aria-hidden="true" />
            <span>Our workspace</span>
            <span className="workspace-dot" />
          </div>
        </div>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <span />
              BETTER TOGETHER
            </span>
            <h1>Find your people.</h1>
            <p>
              Good work starts with a connection.
              <br className="mobile-break" /> Get to know the people who make it
              happen.
            </p>
          </div>
          <div className="hero-art" aria-hidden="true">
            <span className="orbit orbit-one" />
            <span className="orbit orbit-two" />
            <span className="art-line" />
            <span className="art-avatar art-one">RS</span>
            <span className="art-avatar art-two">AK</span>
            <span className="art-avatar art-three">PN</span>
            <span className="art-dot" />
            <span className="together-label">
              <span />A little more connected.
            </span>
          </div>
        </section>
        <section
          id="directory"
          className="directory-section"
          aria-labelledby="directory-title"
        >
          <div className="section-heading">
            <div className="breadcrumb">
              WORKSPACE
              <ChevronRight size={12} aria-hidden="true" />
              PEOPLE
            </div>
            <span className="internal-label">
              <span />
              INTERNAL DIRECTORY
            </span>
          </div>
          <div className="title-row">
            <div>
              <h2 id="directory-title">Employee directory</h2>
              <p>A place for every name. A team behind every role.</p>
            </div>
            <span className="directory-icon" aria-hidden="true">
              <UsersRound size={25} strokeWidth={1.4} />
            </span>
          </div>
          <SearchBar value={search} onChange={setSearch} />
          <div className="search-details">
            <p id="search-help">
              Search the beginning of a name, email or department.
            </p>
            <span>
              <Check size={13} aria-hidden="true" />
              Updated as you type
            </span>
          </div>
          <div className="department-row">
            <span className="department-label">EXPLORE TEAMS</span>
            <div className="department-chips">
              {departments.map((department) => (
                <button
                  key={department}
                  className={`chip ${selectedDepartment === department ? "selected" : ""}`}
                  aria-pressed={selectedDepartment === department}
                  onClick={() =>
                    setSelectedDepartment((current) =>
                      current === department ? null : department
                    )
                  }
                >
                  {department}
                  <ArrowUpRight size={12} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
          <div className="results-heading">
              <h3>
              {query || selectedDepartment ? "Search results" : "Your next connection"}
            </h3>
            <span role="status" aria-live="polite">
              {busy ? (
                <>
                  <LoaderCircle className="spin" size={13} aria-hidden="true" />
                  {directory.status === "waiting"
                    ? "Waiting for you to finish typing…"
                    : "Finding your people…"}
                </>
              ) : directory.status === "success" ? (
                `${directory.items.length}${directory.has_more ? "+" : ""} ${directory.items.length === 1 ? "person" : "people"} found`
              ) : (
                "MADE FOR HUMAN CONNECTION"
              )}
            </span>
          </div>
          <div className="results-content" aria-busy={busy}>
            {busy && <EmployeeSkeletons />}
            {directory.status === "idle" && <EmptyState />}
            {directory.status === "error" && (
              <div className="error-state" role="alert">
                <AlertCircle size={28} />
                <h3>We couldn’t load the directory.</h3>
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
                <EmptyState query={query || selectedDepartment || undefined} />
              ))}
          </div>
          {directory.pageError && (
            <p className="page-error" role="alert">
              {directory.pageError}
            </p>
          )}
          {directory.status === "success" && directory.has_more && (
            <div className="load-more">
              <button
                className="primary-button"
                disabled={directory.loadingMore}
                onClick={directory.loadMore}
              >
                {directory.loadingMore ? (
                  <LoaderCircle size={16} className="spin" />
                ) : (
                  <ArrowDown size={16} />
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
      </main>
      <footer className="site-footer">
        <span className="footer-brand">people.</span>
        <span>Different talents. One team.</span>
        <span className="footer-note">A little closer, every day.</span>
      </footer>
    </div>
  );
}
