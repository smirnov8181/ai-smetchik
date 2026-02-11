"use client";

import { useEffect, useState, useRef } from "react";

/**
 * Hook that animates a number counting up from 0 to `end`.
 * Uses easeOutExpo for a fast start, slow finish effect.
 */
export function useCountUp(end: number, duration = 1200, delay = 0): number {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafId = useRef<number>(0);

  useEffect(() => {
    if (end === 0) {
      setValue(0);
      return;
    }

    const timeout = setTimeout(() => {
      const animate = (timestamp: number) => {
        if (startTime.current === null) startTime.current = timestamp;
        const elapsed = timestamp - startTime.current;
        const progress = Math.min(elapsed / duration, 1);

        // easeOutExpo
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

        setValue(Math.round(eased * end));

        if (progress < 1) {
          rafId.current = requestAnimationFrame(animate);
        }
      };

      rafId.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(rafId.current);
    };
  }, [end, duration, delay]);

  return value;
}
