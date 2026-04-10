"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import type { ProjectLifecycleState } from "@/lib/med-types";

const stateStyles: Record<ProjectLifecycleState, string> = {
  Draft:
    "border-white/10 bg-black/5 text-[color:var(--text-secondary)] shadow-[0_0_0_1px_rgba(0,0,0,0.06)] dark:bg-white/5",
  Requirements:
    "border-[color:color-mix(in_srgb,var(--primary)_40%,transparent)] bg-[color:color-mix(in_srgb,var(--primary)_14%,transparent)] text-[color:var(--primary)] shadow-[0_0_18px_color-mix(in_srgb,var(--primary)_18%,transparent)]",
  Design:
    "border-fuchsia-400/30 bg-fuchsia-500/12 text-fuchsia-300 shadow-[0_0_18px_rgba(192,132,252,0.18)]",
  Validation:
    "border-amber-400/30 bg-amber-500/12 text-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.18)]",
  Freeze:
    "border-orange-400/30 bg-orange-500/12 text-orange-300 shadow-[0_0_18px_rgba(251,146,60,0.18)]",
  "Submission-Ready":
    "border-[color:color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color:color-mix(in_srgb,var(--accent)_16%,transparent)] text-[color:var(--accent)] shadow-[0_0_18px_color-mix(in_srgb,var(--accent)_20%,transparent)]",
  Archived:
    "border-white/10 bg-black/5 text-[color:var(--text-secondary)] shadow-none dark:bg-white/5",
};

export interface StatusBadgeProps {
  /** Lifecycle state for the program, document, or subsystem. */
  state: ProjectLifecycleState;
  /** Optional extra class names for layout integration. */
  className?: string;
}

export function StatusBadge({ state, className }: StatusBadgeProps) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.22 }}
      aria-label={`Status ${state}`}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[12px] font-medium tracking-[0.12em]",
        stateStyles[state],
        className,
      )}
    >
      {state}
    </motion.span>
  );
}

