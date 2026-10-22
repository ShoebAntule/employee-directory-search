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
      <Search size={23} aria-hidden="true" />
      <label className="sr-only" htmlFor="employee-search">
        Search employees by name or department
      </label>
      <input
        type="text"
        role="searchbox"
        id="employee-search"
        ref={input}
        value={value}
        maxLength={150}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by name, email or department…"
        aria-describedby="search-help"
        autoComplete="off"
      />
      {value ? (
        <button
          className="icon-button"
          aria-label="Clear search"
          onClick={() => {
            onChange("");
            input.current?.focus();
          }}
        >
          <X size={19} />
        </button>
      ) : (
        <kbd aria-hidden="true">/</kbd>
      )}
    </div>
  );
}
