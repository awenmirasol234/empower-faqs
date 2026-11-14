import { Search, X } from "lucide-react";
import { useEffect, useRef } from "react";

interface SearchBarProps {
  value: string;
  onChange: (next: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }
      event.preventDefault();
      inputRef.current?.focus();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative w-full max-w-[548px]">
      <span
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5d5f60]"
        aria-hidden="true"
      >
        <Search className="h-3.5 w-3.5" strokeWidth={1.75} />
      </span>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search guides, tags, transcripts..."
        className="h-8 w-full rounded-[6px] border border-[#e8eaec] bg-[#ffffff] pl-8 pr-8 text-[13px] text-[#131416] placeholder:text-[#5d5f60] focus:border-[#cdced1] focus:outline-none"
        type="search"
        aria-label="Search videos and FAQs"
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[#5d5f60] hover:bg-[#ebedee] hover:text-[#131416] focus:outline-none"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : (
        <kbd
          className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-[#e8eaec] bg-[#f4f6f8] px-1.5 py-0.5 font-mono text-[10px] leading-none text-[#5d5f60] sm:inline-block"
          aria-hidden="true"
        >
          /
        </kbd>
      )}
    </div>
  );
}
