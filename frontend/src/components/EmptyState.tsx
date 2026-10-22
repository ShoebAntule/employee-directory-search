export function EmptyState({ query }: { query?: string }) {
  return (
    <div className="empty-state">
      <span className="empty-mark" aria-hidden="true">
        pi.
      </span>
      <h3>
        {query ? "No employees found." : "The right person is a search away."}
      </h3>
      <p>
        {query ? (
          <>
            No matches for <strong>“{query}”</strong> with the current filters.
            Try a shorter search or another department.
          </>
        ) : (
          "Enter a name, email or department above, or choose a team to browse its employees."
        )}
      </p>
    </div>
  );
}
