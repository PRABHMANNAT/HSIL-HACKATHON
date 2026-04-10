"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  /** Headline shown below the illustration. */
  title: string;
  /** Supporting text that explains the empty state. */
  description: string;
  /** Optional action element rendered under the copy. */
  action?: React.ReactNode;
  /** Optional class names for layout composition. */
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.24 }}
      className={cn(
        "flex flex-col items-center justify-center rounded-[28px] border border-dashed border-[var(--border)] bg-[color:color-mix(in_srgb,var(--card)_68%,transparent)] px-6 py-10 text-center",
        className,
      )}
    >
      <svg
        width="132"
        height="96"
        viewBox="0 0 132 96"
        fill="none"
        aria-hidden="true"
        className="mb-5"
      >
        <rect x="18" y="24" width="96" height="54" rx="18" fill="rgba(10,132,255,0.08)" />
        <rect x="28" y="34" width="76" height="34" rx="12" fill="rgba(48,209,88,0.08)" />
        <circle cx="42" cy="51" r="6" fill="var(--primary)" opacity="0.85" />
        <path
          d="M55 51H78M55 59H90"
          stroke="var(--text-secondary)"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.7"
        />
        <circle cx="92" cy="22" r="10" fill="rgba(48,209,88,0.2)" />
        <path
          d="M92 17V27M87 22H97"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <h3 className="text-lg font-medium text-[var(--text-primary)]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </motion.div>
  );
}
