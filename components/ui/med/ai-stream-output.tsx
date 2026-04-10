"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { PauseCircle, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AIStreamOutputProps {
  /** Final output text to stream token by token. */
  text: string;
  /** Phases shown before the full output appears. */
  phases?: string[];
  /** Approximate token budget used to render the meter. */
  tokenBudget?: number;
  /** Optional class names for layout composition. */
  className?: string;
}

export function AIStreamOutput({
  text,
  phases = ["Analyzing requirements...", "Generating architecture..."],
  tokenBudget = 2400,
  className,
}: AIStreamOutputProps) {
  const [phaseIndex, setPhaseIndex] = React.useState(0);
  const [streamed, setStreamed] = React.useState("");
  const [cancelled, setCancelled] = React.useState(false);
  const tokens = text.split(" ");

  React.useEffect(() => {
    if (cancelled) {
      return;
    }

    if (phaseIndex < phases.length) {
      const phaseTimer = window.setTimeout(() => {
        setPhaseIndex((current) => current + 1);
      }, 900);

      return () => window.clearTimeout(phaseTimer);
    }

    if (streamed === text) {
      return;
    }

    const streamTimer = window.setInterval(() => {
      setStreamed((current) => {
        const visibleWords = current.trim() ? current.trim().split(/\s+/).length : 0;
        const nextWord = tokens[visibleWords];
        return nextWord ? `${current}${current ? " " : ""}${nextWord}` : current;
      });
    }, 38);

    return () => window.clearInterval(streamTimer);
  }, [cancelled, phaseIndex, phases.length, streamed, text, tokens]);

  const visibleTokens = streamed.trim() ? streamed.trim().split(/\s+/).length : 0;
  const phaseLabel = phaseIndex < phases.length ? phases[phaseIndex] : "Output ready";
  const usage = Math.min(100, Math.round((visibleTokens / tokenBudget) * 100 * 16));

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      className={cn(
        "rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--card)_92%,transparent),color-mix(in_srgb,var(--surface)_76%,transparent))] p-5 shadow-[0_20px_50px_rgba(8,15,29,0.14)] backdrop-blur-xl",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
            <Sparkles className="size-4 text-[var(--primary)]" />
            AI Copilot Stream
          </div>
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
            {phaseLabel}
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="rounded-full"
          onClick={() => setCancelled(true)}
          disabled={cancelled || streamed === text}
          aria-label="Cancel AI stream"
        >
          <PauseCircle className="mr-2 size-4" />
          Cancel
        </Button>
      </div>
      <div
        className="mt-4 min-h-[168px] rounded-[24px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_76%,transparent)] p-4 font-mono text-sm leading-7 text-[var(--text-primary)]"
        aria-live="polite"
      >
        {phaseIndex < phases.length ? phases[phaseIndex] : streamed}
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY }}
          className="ml-1 inline-block h-5 w-2 rounded-full bg-[var(--primary)] align-middle"
          aria-hidden="true"
        />
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
          <span>Token usage</span>
          <span>
            {visibleTokens}/{tokenBudget}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/8">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${usage}%` }}
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--accent))]"
          />
        </div>
      </div>
    </motion.section>
  );
}
