"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useInView,
  useSpring,
  useTransform,
  useMotionValue,
  type Variants,
} from "framer-motion";

/* ───────────────────────────────────────────
   1. FadeIn — fade + slide on scroll / mount
   ─────────────────────────────────────────── */

interface FadeInProps {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right" | "none";
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
  amount?: number;
}

const directionOffset = {
  up: { y: 40, x: 0 },
  down: { y: -40, x: 0 },
  left: { x: 40, y: 0 },
  right: { x: -40, y: 0 },
  none: { x: 0, y: 0 },
};

export function FadeIn({
  children,
  direction = "up",
  delay = 0,
  duration = 0.6,
  className,
  once = true,
  amount = 0.3,
}: FadeInProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount });
  const offset = directionOffset[direction];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...offset }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...offset }}
      transition={{ duration, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ───────────────────────────────────────────
   2. StaggerContainer + StaggerItem
   ─────────────────────────────────────────── */

const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const staggerItemVariant: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] },
  },
};

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  staggerDelay?: number;
  once?: boolean;
}

export function StaggerContainer({
  children,
  className,
  delay = 0,
  staggerDelay = 0.1,
  once = true,
}: StaggerContainerProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount: 0.2 });

  const variants: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={isInView ? "show" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={staggerItemVariant} className={className}>
      {children}
    </motion.div>
  );
}

/* ───────────────────────────────────────────
   3. CountUp — animated counter on scroll
   ─────────────────────────────────────────── */

interface CountUpProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
  /** "compact" = 120K, "locale" = 120 000, "raw" = 120000 */
  format?: "compact" | "locale" | "raw";
}

export function CountUp({
  value,
  suffix = "",
  prefix = "",
  duration = 2,
  className,
  format = "compact",
}: CountUpProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0,
  });
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      const rounded = Math.round(latest);
      if (format === "locale") {
        setDisplayValue(rounded.toLocaleString("ru-RU"));
      } else if (format === "compact" && rounded >= 1000) {
        setDisplayValue(Math.round(rounded / 1000) + "K");
      } else {
        setDisplayValue(String(rounded));
      }
    });
    return unsubscribe;
  }, [springValue, format]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}

/* ───────────────────────────────────────────
   4. FloatingCard — gentle hovering animation
   ─────────────────────────────────────────── */

export function FloatingCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -8, 0],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        repeatType: "loop",
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}

/* ───────────────────────────────────────────
   5. AnimatedBar — progress bar that fills on scroll
   ─────────────────────────────────────────── */

interface AnimatedBarProps {
  percentage: number;
  className?: string;
  barClassName?: string;
  duration?: number;
}

export function AnimatedBar({
  percentage,
  className,
  barClassName,
  duration = 1,
}: AnimatedBarProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <div ref={ref} className={className}>
      <motion.div
        className={barClassName}
        initial={{ width: "0%" }}
        animate={isInView ? { width: `${percentage}%` } : { width: "0%" }}
        transition={{ duration, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
      />
    </div>
  );
}

/* ───────────────────────────────────────────
   6. ScaleIn — scale from 0.8 to 1 on scroll
   ─────────────────────────────────────────── */

export function ScaleIn({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
