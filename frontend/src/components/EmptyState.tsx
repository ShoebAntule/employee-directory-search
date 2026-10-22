import { Search, UsersRound } from "lucide-react";

export function EmptyState({ query }: { query?: string }) {
  return (
    <div className="empty-state">
      <div className="empty-illustration" aria-hidden="true">
        <span className="empty-ring" />
        <span className="empty-avatar left">AK</span>
        <span className="empty-avatar right">RS</span>
        <span className="empty-center">
          {query ? (
            <Search size={32} strokeWidth={1.5} />
          ) : (
            <UsersRound size={35} strokeWidth={1.4} />
          )}
        </span>
      </div>
      <h3>
        {query
          ? "No people found. Keep looking."
          : "The right person is a search away."}
      </h3>
      <p>
        {query ? (
          <>
            We couldn’t find a name or department starting with{" "}
            <strong>“{query}”</strong>. Try a shorter name or a different
            department.
          </>
        ) : (
          "Find a familiar face, discover a teammate, or put a name to the people behind the work."
        )}
      </p>
      {!query && (
        <span className="empty-note">
          Start with a name, or choose a department above.
        </span>
      )}
    </div>
  );
}
