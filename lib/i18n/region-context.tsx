"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Region, translations } from "./translations";

interface RegionContextType {
  region: Region;
  setRegion: (region: Region) => void;
  t: typeof translations.RU;
  formatPrice: (amount: number) => string;
  currency: string;
  currencySymbol: string;
}

const RegionContext = createContext<RegionContextType | null>(null);

export function RegionProvider({ children }: { children: ReactNode }) {
  const [region, setRegionState] = useState<Region>("RU");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem("region") as Region | null;
    if (saved && (saved === "RU" || saved === "US")) {
      setRegionState(saved);
    }
    setMounted(true);
  }, []);

  const setRegion = (newRegion: Region) => {
    setRegionState(newRegion);
    localStorage.setItem("region", newRegion);
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

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <RegionContext.Provider
        value={{
          region: "RU",
          setRegion,
          t: translations.RU,
          formatPrice: (amount) => new Intl.NumberFormat("ru-RU").format(amount) + " руб.",
          currency: "руб.",
          currencySymbol: "₽",
        }}
      >
        {children}
      </RegionContext.Provider>
    );
  }

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
