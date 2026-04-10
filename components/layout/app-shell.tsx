"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { Leva } from "leva";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { CommandPalette } from "@/components/ui/med/command-palette";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fullBleedRoute = pathname === "/3d-design";

  return (
    <div className="flex min-h-screen bg-[var(--surface)] text-[var(--text-primary)]">
      <AppSidebar />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--primary)_10%,transparent),transparent_35%),radial-gradient(circle_at_bottom_right,color-mix(in_srgb,var(--accent)_10%,transparent),transparent_35%)]" />
        <div className="relative flex min-h-screen flex-col">
          <AppHeader />
          <main className={cn("flex-1 overflow-hidden", fullBleedRoute ? "p-0" : "p-4")}>
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
                className={cn(fullBleedRoute && "h-full")}
              >
                {fullBleedRoute ? (
                  children
                ) : (
                  <div className="h-full overflow-auto rounded-[34px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--card)_86%,transparent),color-mix(in_srgb,var(--surface)_82%,transparent))] p-4 shadow-[0_30px_80px_rgba(7,12,24,0.14)] backdrop-blur-2xl sm:p-6">
                    {children}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
      <CommandPalette />
      <Leva
        collapsed
        oneLineLabels
        theme={{
          sizes: { rootWidth: "340px", controlWidth: "150px" },
          colors: {
            accent1: "#0A84FF",
            accent2: "#0055CC",
            accent3: "#30D158",
          },
        }}
      />
    </div>
  );
}
