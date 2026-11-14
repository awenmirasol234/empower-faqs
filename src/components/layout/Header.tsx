import { Menu } from "lucide-react";
import { Link } from "react-router-dom";
import type { SiteConfig } from "../../types/content.ts";
import { SearchBar } from "./SearchBar.tsx";

interface HeaderProps {
  site: SiteConfig;
  searchQuery: string;
  onSearchChange: (next: string) => void;
  onOpenMobileNav: () => void;
}

export function Header({
  site,
  searchQuery,
  onSearchChange,
  onOpenMobileNav,
}: HeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 bg-[#f8fafc] px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5 md:w-[212px]">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-[#5d5f60] hover:bg-[#eef3fe] hover:text-[#2d5be3] focus:outline-none md:hidden"
          aria-label="Open module navigation"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] bg-[#2d5be3] text-[11px] font-semibold tracking-tight text-white">
          EM
        </div>
        <span className="truncate text-[14px] font-medium tracking-tight text-[#131416]">
          {site.title}
        </span>
      </div>

      <div className="hidden flex-1 justify-center sm:flex">
        <SearchBar value={searchQuery} onChange={onSearchChange} />
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 md:w-[140px]">
        <Link
          to="/admin"
          className="rounded-[6px] px-2.5 py-1 text-[13px] font-medium text-[#5d5f60] transition-colors hover:bg-[#eef3fe] hover:text-[#2d5be3]"
        >
          Admin
        </Link>
      </div>
    </header>
  );
}
