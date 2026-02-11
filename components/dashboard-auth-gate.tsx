"use client";

import { useAnonAuth } from "@/hooks/use-anon-auth";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Client wrapper that ensures a user session exists before rendering children.
 * If no session — signs in anonymously (with retries).
 * Shows loading skeleton while initializing.
 */
export function DashboardAuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, error } = useAnonAuth();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-20 w-full space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-3xl" />
          <Skeleton className="h-24 rounded-3xl" />
          <Skeleton className="h-24 rounded-3xl" />
        </div>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 rounded-3xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-20 w-full">
        <div className="bg-white rounded-3xl p-12 border border-[#161616]/5 text-center">
          <p className="text-[#161616]/50 mb-2">
            {error || "Не удалось создать сессию"}
          </p>
          <p className="text-[#161616]/30 text-sm mb-4">
            Попробуйте обновить страницу или очистить cookies
          </p>
          <button
            onClick={() => window.location.reload()}
            className="cursor-pointer bg-[#0D8DFF] text-[#161616] font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-all"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
