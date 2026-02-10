"use client";

import { ReactNode } from "react";
import { FadeIn, StaggerContainer, StaggerItem, ScaleIn } from "@/components/ui/animations";

/* Animated wrapper for dashboard stat cards grid */
export function AnimatedStatsGrid({ children }: { children: ReactNode }) {
  return (
    <StaggerContainer className="grid md:grid-cols-3 gap-4" staggerDelay={0.1}>
      {children}
    </StaggerContainer>
  );
}

export function AnimatedStatCard({ children }: { children: ReactNode }) {
  return <StaggerItem>{children}</StaggerItem>;
}

/* Animated wrapper for section heading + button row */
export function AnimatedSectionHeader({ children }: { children: ReactNode }) {
  return (
    <FadeIn direction="up" delay={0.1}>
      {children}
    </FadeIn>
  );
}

/* Animated list of cards (estimates or verifications) */
export function AnimatedCardList({ children }: { children: ReactNode }) {
  return (
    <StaggerContainer className="space-y-3" staggerDelay={0.08} delay={0.15}>
      {children}
    </StaggerContainer>
  );
}

export function AnimatedCardItem({ children }: { children: ReactNode }) {
  return <StaggerItem>{children}</StaggerItem>;
}

/* Animated empty state */
export function AnimatedEmptyState({ children }: { children: ReactNode }) {
  return (
    <ScaleIn delay={0.2}>
      {children}
    </ScaleIn>
  );
}
