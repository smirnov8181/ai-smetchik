"use client";

import { useRegion } from "@/lib/i18n/region-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

export function RegionSwitcher() {
  const { region, setRegion } = useRegion();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <Globe className="h-4 w-4" />
          <span className="font-medium">{region}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setRegion("RU")}
          className={region === "RU" ? "bg-accent" : ""}
        >
          <span className="mr-2">🇷🇺</span>
          Россия (₽)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setRegion("US")}
          className={region === "US" ? "bg-accent" : ""}
        >
          <span className="mr-2">🇺🇸</span>
          United States ($)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
