import { ArrowRight, Search, UsersRound } from "lucide-react";

export function EmptyState({ query }: { query?: string }) {
  return (
    <div className="empty-state">
      <div className="empty-symbol" aria-hidden="true">
        {query ? (
          <Search size={31} strokeWidth={1.6} />
        ) : (
          <UsersRound size={31} strokeWidth={1.6} />
        )}
      </div>
      <span className="empty-eyebrow">
        {query ? "LET’S TRY THAT AGAIN" : "A DIRECTORY BUILT AROUND PEOPLE"}
      </span>
      <h3>
        {query
          ? "No matches for this search."
          : "The right person is a search away."}
      </h3>
      <p>
        {query ? (
          <>
            Nothing matched <strong>“{query}”</strong> with the current filters.
            Try a shorter search or clear the selected department.
          </>
        ) : (
          "Search by name, email, or department. You can also choose a team to explore the people behind it."
        )}
      </p>
      {!query && (
        <div className="example-search" aria-hidden="true">
          <span>rah</span>
          <ArrowRight size={14} />
          <strong>Rahul</strong>
          <span className="example-divider" />
          <span>eng</span>
          <ArrowRight size={14} />
          <strong>Engineering</strong>
        </div>
      )}
    </div>
  );
}
