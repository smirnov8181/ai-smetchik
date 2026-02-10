"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe } from "lucide-react";

export function LandingRegionSwitcher() {
  const pathname = usePathname();
  const isUS = pathname === "/us";

  return (
    <div className="flex items-center gap-1">
      <Globe className="h-4 w-4 opacity-50" />
      {isUS ? (
        <Link
          href="/ru"
          className="text-sm font-medium opacity-70 hover:opacity-100 transition-opacity"
        >
          🇷🇺 RU
        </Link>
      ) : (
        <Link
          href="/us"
          className="text-sm font-medium opacity-70 hover:opacity-100 transition-opacity"
        >
          🇺🇸 US
        </Link>
      )}
    </div>
  );
}
