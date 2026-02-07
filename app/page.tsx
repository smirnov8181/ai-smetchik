"use client";

import { useRegion } from "@/lib/i18n/region-context";
import { LandingContent } from "@/components/landing-content";
import { USLanding } from "@/components/us-landing";

export default function LandingPage() {
  const { region } = useRegion();

  if (region === "US") {
    return <USLanding />;
  }

  return <LandingContent />;
}
