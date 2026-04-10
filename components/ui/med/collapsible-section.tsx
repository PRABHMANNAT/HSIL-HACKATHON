"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CollapsibleSectionProps {
  /** Section title rendered in the sticky header. */
  title: string;
  /** One-line supporting summary. */
  summary: string;
  /** Optional stat chips shown in the header. */
  stats?: string[];
  /** Content rendered when the section is expanded. */
  children: React.ReactNode;
  /** Whether the section should start expanded. */
  defaultOpen?: boolean;
  /** Optional extra class names for layout composition. */
  className?: string;
}

export function CollapsibleSection({
  title,
  summary,
  stats = [],
  children,
  defaultOpen = true,
  className,
}: CollapsibleSectionProps) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--card)]/76 backdrop-blur-xl",
        className,
      )}
    >
      <div className="sticky top-0 z-10 border-b border-[var(--border)] bg-[color:color-mix(in_srgb,var(--card)_88%,transparent)] px-5 py-4 backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-lg font-medium text-[var(--text-primary)]">{title}</h3>
            <p className="text-sm text-[var(--text-secondary)]">{summary}</p>
          </div>
          <div className="flex items-center gap-2">
            {stats.map((stat) => (
              <span
                key={stat}
                className="rounded-full border border-[var(--border)] px-3 py-1 text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]"
              >
                {stat}
              </span>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpen((current) => !current)}
              aria-expanded={open}
              aria-label={`${open ? "Collapse" : "Expand"} ${title}`}
              className="rounded-full"
            >
              <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
            </Button>
          </div>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24 }}
            className="overflow-hidden"
          >
            <div className="p-5">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
