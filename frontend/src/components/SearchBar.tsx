import { Search, X } from "lucide-react";
import { useRef } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: Props) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="search-box">
      <Search size={21} aria-hidden="true" />
      <input
        ref={input}
        id="employee-search"
        type="text"
        role="searchbox"
        aria-label="Search employees by name, email or department"
        aria-describedby="search-help"
        value={value}
        maxLength={150}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search the directory"
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
          <X size={17} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
