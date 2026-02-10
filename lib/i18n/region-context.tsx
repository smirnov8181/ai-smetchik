"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Region, translations } from "./translations";

type Translations = (typeof translations)[Region];

interface RegionContextType {
  region: Region;
  setRegion: (region: Region) => void;
  t: Translations;
  formatPrice: (amount: number) => string;
  currency: string;
  currencySymbol: string;
}

const RegionContext = createContext<RegionContextType | null>(null);

function getRegionFromPath(pathname: string): Region {
  // If URL starts with /ru, it's the RU region
  if (pathname.startsWith("/ru")) return "RU";
  return "US";
}

export function RegionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pathRegion = getRegionFromPath(pathname);
  const [region, setRegionState] = useState<Region>(pathRegion);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Sync region with URL path — path is the source of truth
    setRegionState(pathRegion);
    setMounted(true);
  }, [pathRegion]);

  const setRegion = (newRegion: Region) => {
    setRegionState(newRegion);
  };

  const t = translations[region];

  const formatPrice = (amount: number): string => {
    if (region === "US") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    }
    return new Intl.NumberFormat("ru-RU").format(amount) + " руб.";
  };

  return (
    <RegionContext.Provider
      value={{
        region,
        setRegion,
        t,
        formatPrice,
        currency: t.currency,
        currencySymbol: t.currencySymbol,
      }}
    >
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  const context = useContext(RegionContext);
  if (!context) {
    throw new Error("useRegion must be used within RegionProvider");
  }
  return context;
}
