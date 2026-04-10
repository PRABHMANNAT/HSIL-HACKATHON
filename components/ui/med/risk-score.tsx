"use client";

import { motion } from "framer-motion";

import type { RiskBreakdown } from "@/lib/med-types";
import { cn } from "@/lib/utils";

function segmentOffset(radius: number, values: number[], index: number) {
  const total = values.reduce((sum, current) => sum + current, 0);
  const circumference = 2 * Math.PI * radius;
  const completed = values.slice(0, index).reduce((sum, current) => sum + current, 0);
  return circumference - (completed / total) * circumference;
}

function segmentLength(radius: number, value: number, total: number) {
  const circumference = 2 * Math.PI * radius;
  return `${(value / total) * circumference} ${circumference}`;
}

export interface RiskScoreProps {
  /** Human-readable label for the risk domain. */
  label: string;
  /** Overall 1-10 risk score. */
  score: number;
  /** Severity split used to render the donut chart. */
  breakdown?: RiskBreakdown;
  /** Render a denser version for table and card layouts. */
  compact?: boolean;
  /** Optional class names for outer layout composition. */
  className?: string;
}

export function RiskScore({
  label,
  score,
  breakdown = { low: 25, medium: 35, high: 40 },
  compact = false,
  className,
}: RiskScoreProps) {
  const tone =
    score <= 3
      ? {
          pill: "bg-[color:color-mix(in_srgb,var(--accent)_16%,transparent)] text-[var(--accent)]",
          glow: "shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_18%,transparent)]",
        }
      : score <= 6
        ? {
            pill: "bg-[color:color-mix(in_srgb,var(--warning)_16%,transparent)] text-[var(--warning)]",
            glow: "shadow-[0_0_24px_color-mix(in_srgb,var(--warning)_18%,transparent)]",
          }
        : {
            pill: "bg-[color:color-mix(in_srgb,var(--danger)_16%,transparent)] text-[var(--danger)]",
            glow: "shadow-[0_0_24px_color-mix(in_srgb,var(--danger)_22%,transparent)]",
          };

  const values = [breakdown.low, breakdown.medium, breakdown.high];
  const total = values.reduce((sum, current) => sum + current, 0);
  const radius = 24;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className={cn(
        compact
          ? "flex min-w-[158px] items-center justify-between gap-3 rounded-[22px] border border-[var(--border)] bg-[var(--card)]/84 px-3 py-2.5 backdrop-blur-xl"
          : "flex items-center justify-between gap-4 rounded-[28px] border border-[var(--border)] bg-[var(--card)]/84 p-4 backdrop-blur-xl",
        tone.glow,
        className,
      )}
      aria-label={`${label} risk score ${score} of 10`}
    >
      <div className="space-y-2">
        <div
          className={cn(
            "uppercase tracking-[0.22em] text-[var(--text-secondary)]",
            compact ? "text-[10px]" : "text-xs",
          )}
        >
          {label}
        </div>
        <motion.div
          animate={score >= 7 ? { scale: [1, 1.05, 1] } : {}}
          transition={score >= 7 ? { duration: 1.8, repeat: Number.POSITIVE_INFINITY } : {}}
          className={cn(
            "inline-flex rounded-full font-semibold",
            compact ? "px-2.5 py-0.5 text-sm" : "px-3 py-1 text-lg",
            tone.pill,
          )}
        >
          {score}/10
        </motion.div>
      </div>
      <div className="relative">
        <svg
          width={compact ? "52" : "64"}
          height={compact ? "52" : "64"}
          viewBox="0 0 64 64"
          className="-rotate-90"
        >
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="transparent"
            stroke="color-mix(in srgb, var(--text-secondary) 18%, transparent)"
            strokeWidth="7"
          />
          <motion.circle
            cx="32"
            cy="32"
            r={radius}
            fill="transparent"
            stroke="var(--accent)"
            strokeWidth="7"
            strokeDasharray={segmentLength(radius, breakdown.low, total)}
            strokeDashoffset={segmentOffset(radius, values, 0)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
          <motion.circle
            cx="32"
            cy="32"
            r={radius}
            fill="transparent"
            stroke="var(--warning)"
            strokeWidth="7"
            strokeDasharray={segmentLength(radius, breakdown.medium, total)}
            strokeDashoffset={segmentOffset(radius, values, 1)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
          <motion.circle
            cx="32"
            cy="32"
            r={radius}
            fill="transparent"
            stroke="var(--danger)"
            strokeWidth="7"
            strokeDasharray={segmentLength(radius, breakdown.high, total)}
            strokeDashoffset={segmentOffset(radius, values, 2)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        </svg>
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center font-medium text-[var(--text-secondary)]",
            compact ? "text-[10px]" : "text-xs",
          )}
        >
          split
        </div>
      </div>
    </motion.div>
  );
}
