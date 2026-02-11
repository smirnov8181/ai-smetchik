"use client";

import Link from "next/link";
import { useRegion } from "@/lib/i18n/region-context";
import { useAnonAuth } from "@/hooks/use-anon-auth";
import { FileText, LogOut, UserPlus } from "lucide-react";

interface DashboardHeaderProps {
  onLogout: () => void;
}

export function DashboardHeader({ onLogout }: DashboardHeaderProps) {
  const { t } = useRegion();
  const { isAnonymous } = useAnonAuth();

  return (
    <header className="border-b border-[#161616]/10 bg-white">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/ru/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#161616] rounded-xl flex items-center justify-center">
            <FileText className="h-5 w-5 text-[#FAF4EC]" />
          </div>
          <span className="font-bold text-xl text-[#161616]">{t.appName}</span>
        </Link>
        <div className="flex items-center gap-3">
          {isAnonymous ? (
            <>
              <Link href="/ru/login">
                <button className="cursor-pointer text-[#161616]/70 hover:text-[#161616] font-medium px-3 py-2 text-sm transition-colors hidden sm:block">
                  Войти
                </button>
              </Link>
              <Link href="/ru/register">
                <button className="cursor-pointer flex items-center gap-2 bg-[#33C791] text-[#161616] font-semibold px-4 py-2 rounded-xl text-sm hover:opacity-90 transition-all">
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Зарегистрироваться</span>
                </button>
              </Link>
            </>
          ) : (
            <form action={onLogout}>
              <button
                type="submit"
                className="cursor-pointer flex items-center gap-2 text-[#161616]/70 hover:text-[#161616] font-medium px-3 py-2 rounded-xl text-sm transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t.logout}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
