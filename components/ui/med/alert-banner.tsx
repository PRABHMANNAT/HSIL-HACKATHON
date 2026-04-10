"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AlertSeverity } from "@/lib/med-types";

const severityConfig: Record<
  AlertSeverity,
  { icon: typeof Info; className: string; iconColor: string }
> = {
  warning: {
    icon: AlertTriangle,
    className:
      "border-amber-400/25 bg-[color:color-mix(in_srgb,var(--warning)_14%,transparent)]",
    iconColor: "var(--warning)",
  },
  error: {
    icon: AlertCircle,
    className:
      "border-red-400/25 bg-[color:color-mix(in_srgb,var(--danger)_14%,transparent)]",
    iconColor: "var(--danger)",
  },
  info: {
    icon: Info,
    className:
      "border-blue-400/25 bg-[color:color-mix(in_srgb,var(--primary)_14%,transparent)]",
    iconColor: "var(--primary)",
  },
  success: {
    icon: CheckCircle2,
    className:
      "border-emerald-400/25 bg-[color:color-mix(in_srgb,var(--accent)_14%,transparent)]",
    iconColor: "var(--accent)",
  },
};

export interface AlertBannerProps {
  /** Visual severity of the alert. */
  type: AlertSeverity;
  /** Headline rendered next to the icon. */
  title: string;
  /** Supporting description shown under the headline. */
  description: string;
  /** Optional action label rendered as a link button. */
  actionLabel?: string;
  /** Optional href for the action button. */
  actionHref?: string;
  /** Whether the banner should start visible. */
  defaultVisible?: boolean;
  /** Optional class names for layout composition. */
  className?: string;
}

export function AlertBanner({
  type,
  title,
  description,
  actionLabel,
  actionHref,
  defaultVisible = true,
  className,
}: AlertBannerProps) {
  const [visible, setVisible] = React.useState(defaultVisible);
  const Icon = severityConfig[type].icon;

  return (
    <AnimatePresence initial={false}>
      {visible ? (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.25 }}
          className={cn(
            "flex items-start gap-4 rounded-[26px] border p-4 shadow-[0_18px_40px_rgba(7,12,24,0.14)] backdrop-blur-xl",
            severityConfig[type].className,
            className,
          )}
        >
          <div
            className="mt-0.5 flex size-10 items-center justify-center rounded-2xl"
            style={{
              background: `color-mix(in srgb, ${severityConfig[type].iconColor} 16%, transparent)`,
              color: severityConfig[type].iconColor,
            }}
          >
            <Icon className="size-5" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="font-medium text-[var(--text-primary)]">{title}</div>
            <p className="text-sm text-[var(--text-secondary)]">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            {actionLabel && actionHref ? (
              <Button asChild variant="secondary" className="rounded-full">
                <Link href={actionHref}>{actionLabel}</Link>
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Dismiss ${title}`}
              className="rounded-full"
              onClick={() => setVisible(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

