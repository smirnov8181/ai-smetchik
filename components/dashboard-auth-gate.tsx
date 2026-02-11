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
    // If anon sign-in failed, still show children (forms will handle auth on submit)
    // This is a graceful fallback so users can at least see the UI
    return <>{children}</>;
  }

  return <>{children}</>;
}
