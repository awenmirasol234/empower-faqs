import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (next: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative w-full max-w-xl">
      <span
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
        aria-hidden="true"
      >
        <Search className="h-[18px] w-[18px]" strokeWidth={2} />
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search videos, FAQs, tags, transcripts…"
        className="w-full rounded-full border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-zinc-400 focus:border-accentBlue focus:outline-none focus:ring-1 focus:ring-accentBlue min-h-[44px]"
        type="search"
        aria-label="Search videos and FAQs"
      />
    </div>
  );
}
