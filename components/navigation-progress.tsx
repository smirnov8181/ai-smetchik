"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin progress bar at the top of the page during navigation.
 * Detects route changes via usePathname + useSearchParams.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prevPath = useRef(pathname + searchParams.toString());

  useEffect(() => {
    const currentPath = pathname + searchParams.toString();

    if (currentPath !== prevPath.current) {
      // Navigation completed — finish the bar
      prevPath.current = currentPath;
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [pathname, searchParams]);

  // Listen for click on links/buttons to start the progress
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a[href]");
      const button = target.closest("button");

      // Check if it's an internal navigation link
      if (anchor) {
        const href = anchor.getAttribute("href");
        if (href && href.startsWith("/") && !href.startsWith("//")) {
          startProgress();
        }
      }

      // Check if button has data-nav attribute or is inside a form
      if (button && button.hasAttribute("data-nav")) {
        startProgress();
      }
    };

    const startProgress = () => {
      setVisible(true);
      setProgress(20);

      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 90) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 90;
          }
          // Slow down as we get higher
          const increment = p < 50 ? 8 : p < 70 ? 4 : 2;
          return Math.min(p + increment, 90);
        });
      }, 200);
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s" }}
    >
      <div
        className="h-full bg-primary rounded-r-full shadow-[0_0_10px_rgba(0,0,0,0.1)]"
        style={{
          width: `${progress}%`,
          transition:
            progress === 100
              ? "width 0.2s ease-out"
              : progress === 0
              ? "none"
              : "width 0.4s ease",
        }}
      />
    </div>
  );
}
