"use client";

import * as React from "react";
import { motion, useMotionValueEvent, useSpring } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function buildSparklinePath(values: number[], width: number, height: number) {
  if (!values.length) {
    return "";
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export interface VitalCardProps {
  /** Metric label rendered in the card header. */
  label: string;
  /** Current metric value. */
  value: number;
  /** Unit suffix rendered next to the value. */
  unit: string;
  /** Positive or negative trend percentage. */
  trend: number;
  /** Sparkline values, typically the last seven readings. */
  sparklineData: number[];
  /** Accent color used for the sparkline and focus glow. */
  color?: string;
  /** Optional footer rendered below the sparkline for extra KPI detail. */
  footer?: React.ReactNode;
  /** Delay in seconds for staggered entrance animations. */
  animationDelay?: number;
  /** Optional extra class names for layout integration. */
  className?: string;
}

export function VitalCard({
  label,
  value,
  unit,
  trend,
  sparklineData,
  color = "var(--primary)",
  footer,
  animationDelay = 0,
  className,
}: VitalCardProps) {
  const spring = useSpring(0, { stiffness: 120, damping: 24 });
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useMotionValueEvent(spring, "change", (latest) => {
    setDisplayValue(latest);
  });

  const trendPositive = trend >= 0;
  const sparklinePath = buildSparklinePath(sparklineData, 220, 46);
  const trendColor = trendPositive ? "var(--accent)" : "var(--danger)";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.article
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -2, scale: 1.01 }}
          transition={{ duration: 0.25, delay: animationDelay }}
          aria-label={`${label} ${value}${unit}, trend ${trend}%`}
          className={cn(
            "relative overflow-hidden rounded-[30px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--card)_94%,transparent),color-mix(in_srgb,var(--surface)_78%,transparent))] p-5 shadow-[0_25px_60px_rgba(8,15,29,0.16)] backdrop-blur-xl",
            className,
          )}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-30 blur-3xl"
            style={{ background: `radial-gradient(circle at top left, ${color}, transparent 70%)` }}
          />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">
                {label}
              </div>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-4xl font-semibold tracking-tight text-[var(--text-primary)]">
                  {displayValue.toFixed(value % 1 === 0 ? 0 : 1)}
                </span>
                <span className="pb-1 text-sm text-[var(--text-secondary)]">{unit}</span>
              </div>
            </div>
            <div
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{
                background: `color-mix(in srgb, ${trendColor} 16%, transparent)`,
                color: trendColor,
              }}
            >
              {trendPositive ? (
                <ArrowUpRight className="size-3.5" />
              ) : (
                <ArrowDownRight className="size-3.5" />
              )}
              {Math.abs(trend)}%
            </div>
          </div>
          <div className="relative mt-6 h-[52px] w-full">
            <svg viewBox="0 0 220 52" className="h-full w-full" aria-hidden="true">
              <path
                d={sparklinePath}
                fill="none"
                stroke={color}
                strokeOpacity="0.25"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <motion.path
                d={sparklinePath}
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
          </div>
          {footer ? <div className="relative mt-4">{footer}</div> : null}
        </motion.article>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={12} className="min-w-[220px] rounded-2xl">
        <div className="space-y-2">
          <div className="font-medium">{label} history</div>
          <ul className="space-y-1 text-[11px] text-background/80">
            {sparklineData.map((point, index) => (
              <li key={`${label}-${point}-${index}`} className="flex justify-between gap-6">
                <span>Sample {index + 1}</span>
                <span>
                  {point}
                  {unit}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
