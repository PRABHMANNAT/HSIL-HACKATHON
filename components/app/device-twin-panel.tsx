"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Box, Waves } from "lucide-react";

const DeviceTwinCanvas = dynamic(() => import("@/components/app/device-twin-canvas"), {
  ssr: false,
});

export function DeviceTwinPanel() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      className="overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--card)]/74"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
            <Box className="size-4 text-[var(--primary)]" />
            Digital Twin
          </div>
          <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
            Device envelope, telemetry glow, and service access geometry
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
          <Waves className="size-3.5 text-[var(--accent)]" />
          3D design
        </div>
      </div>
      <div className="h-[420px]">
        <DeviceTwinCanvas />
      </div>
    </motion.section>
  );
}
