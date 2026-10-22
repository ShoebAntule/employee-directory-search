import { Search, X } from "lucide-react";
import { useEffect, useRef } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: Props) {
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !target?.closest('input, textarea, select, [contenteditable="true"]')
      ) {
        event.preventDefault();
        input.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="search-box">
      <Search size={22} aria-hidden="true" />
      <label className="sr-only" htmlFor="employee-search">
        Search employees by name, email or department
      </label>
      <input
        type="text"
        role="searchbox"
        id="employee-search"
        ref={input}
        value={value}
        maxLength={150}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Try a name, email, or department"
        aria-describedby="search-help"
        autoComplete="off"
      />
      {value && (
        <button
          type="button"
          className="clear-search"
          aria-label="Clear search"
          onClick={() => {
            onChange("");
            input.current?.focus();
          }}
        >
          <X size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
