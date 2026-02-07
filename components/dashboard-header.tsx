"use client";

import Link from "next/link";
import { useRegion } from "@/lib/i18n/region-context";
import { RegionSwitcher } from "@/components/region-switcher";
import { Button } from "@/components/ui/button";
import { FileText, Plus, LogOut, ShieldCheck } from "lucide-react";

interface DashboardHeaderProps {
  onLogout: () => void;
}

export function DashboardHeader({ onLogout }: DashboardHeaderProps) {
  const { t, region } = useRegion();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">{t.appName}</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/estimates/new">
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              {t.newEstimate}
            </Button>
          </Link>
          <Link href="/dashboard/verify/new">
            <Button size="sm" variant="outline">
              <ShieldCheck className="mr-1 h-4 w-4" />
              {t.verifyEstimate}
            </Button>
          </Link>
          <RegionSwitcher />
          <form action={onLogout}>
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="mr-1 h-4 w-4" />
              {t.logout}
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
