"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export interface ProgressRingProps {
  /** Completion percentage shown in the ring. */
  percentage: number;
  /** Diameter of the ring in pixels. */
  size?: number;
  /** Short label rendered below the percentage. */
  label: string;
  /** Stroke color for the active arc. */
  color?: string;
  /** Optional class names for layout composition. */
  className?: string;
}

export function ProgressRing({
  percentage,
  size = 110,
  label,
  color = "var(--primary)",
  className,
}: ProgressRingProps) {
  const safePercentage = Math.max(0, Math.min(100, percentage));
  const strokeWidth = 10;
  const radius = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safePercentage / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "inline-flex flex-col items-center gap-3 rounded-[28px] border border-[var(--border)] bg-[var(--card)]/82 px-4 py-5 text-center shadow-[0_18px_50px_rgba(8,15,29,0.12)] backdrop-blur-xl",
        className,
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safePercentage}
      aria-label={`${label} progress ${safePercentage}%`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="color-mix(in srgb, var(--text-secondary) 18%, transparent)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            {safePercentage}%
          </span>
        </div>
      </div>
      <div className="text-sm text-[var(--text-secondary)]">{label}</div>
    </motion.div>
  );
}

