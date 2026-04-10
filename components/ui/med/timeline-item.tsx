"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TimelineItemProps {
  /** Short avatar label, typically initials. */
  avatar: string;
  /** Actor responsible for the activity. */
  actor: string;
  /** Action sentence shown in the feed. */
  action: string;
  /** ISO timestamp used to render relative time. */
  timestamp: string;
  /** Link target for the related workspace artifact. */
  href: string;
  /** Optional expandable detail text. */
  detail?: string;
  /** Optional extra class names for layout composition. */
  className?: string;
}

export function TimelineItem({
  avatar,
  actor,
  action,
  timestamp,
  href,
  detail,
  className,
}: TimelineItemProps) {
  const [expanded, setExpanded] = React.useState(false);
  const relativeTime = formatDistanceToNow(new Date(timestamp), { addSuffix: true });

  return (
    <motion.article
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-[24px] border border-[var(--border)] bg-[var(--card)]/70 p-4 backdrop-blur-xl",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[color:color-mix(in_srgb,var(--primary)_18%,transparent)] text-sm font-semibold text-[var(--primary)]">
          {avatar}
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="text-sm leading-6 text-[var(--text-primary)]">
            <span className="font-medium">{actor}</span> {action}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
            <span>{relativeTime}</span>
            <Link href={href} className="inline-flex items-center gap-1 hover:text-[var(--primary)]">
              Open
              <ExternalLink className="size-3.5" />
            </Link>
          </div>
          {detail ? (
            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setExpanded((current) => !current)}
                aria-expanded={expanded}
                className="mt-1 h-auto px-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Details
                <ChevronDown
                  className={cn("ml-1 size-4 transition-transform", expanded && "rotate-180")}
                />
              </Button>
              <AnimatePresence initial={false}>
                {expanded ? (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden pr-2 text-sm leading-6 text-[var(--text-secondary)]"
                  >
                    {detail}
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </div>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}

