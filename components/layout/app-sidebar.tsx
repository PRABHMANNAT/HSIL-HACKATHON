"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, HeartPulse } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { navigationSections } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspace-store";

function SidebarContent({
  collapsed,
  mobile,
}: {
  collapsed: boolean;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const pushRecentCommand = useWorkspaceStore((state) => state.pushRecentCommand);
  const toggleSidebar = useWorkspaceStore((state) => state.toggleSidebar);
  const setMobileNavOpen = useWorkspaceStore((state) => state.setMobileNavOpen);

  return (
    <div className="flex h-full flex-col px-3 py-4">
      <div className="flex items-center justify-between gap-3 px-2 pb-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{
              scale: [1, 1.06, 1],
              boxShadow: [
                "0 0 0 rgba(10,132,255,0.15)",
                "0 0 22px rgba(10,132,255,0.35)",
                "0 0 0 rgba(10,132,255,0.15)",
              ],
            }}
            transition={{ duration: 2.8, repeat: Number.POSITIVE_INFINITY }}
            className="flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--primary),var(--accent))] text-white"
          >
            <HeartPulse className="size-5" />
          </motion.div>
          {collapsed && !mobile ? null : (
            <div className="space-y-0.5">
              <div className="text-sm font-semibold tracking-[0.18em] text-[var(--text-primary)]">
                MedDevice
              </div>
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                Suite Pro
              </div>
            </div>
          )}
        </div>
        {mobile ? null : (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
            onClick={toggleSidebar}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
        )}
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto pb-4">
        {navigationSections.map((section) => (
          <div key={section.id} className="space-y-2">
            {collapsed && !mobile ? (
              <div className="mx-auto h-px w-6 bg-[var(--border)]" />
            ) : (
              <div className="px-2 text-[11px] uppercase tracking-[0.24em] text-[var(--text-secondary)]">
                {section.label}
              </div>
            )}
            <nav className="space-y-1" aria-label={section.label}>
              {section.items.map((item) => {
                const active = pathname === item.path;
                const link = (
                  <Link
                    href={item.path}
                    onClick={() => {
                      pushRecentCommand(item.slug);
                      if (mobile) {
                        setMobileNavOpen(false);
                      }
                    }}
                    className={cn(
                      "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all",
                      active
                        ? "bg-[color:color-mix(in_srgb,var(--primary)_16%,transparent)] text-[var(--text-primary)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--primary)_20%,transparent)]"
                        : "text-[var(--text-secondary)] hover:bg-white/6 hover:text-[var(--text-primary)]",
                      collapsed && !mobile && "justify-center px-0",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <item.icon
                      className={cn(
                        "size-4 shrink-0",
                        active ? "text-[var(--primary)]" : "text-current",
                      )}
                    />
                    {collapsed && !mobile ? null : (
                      <>
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {item.badge ? (
                          <span className="rounded-full bg-[color:color-mix(in_srgb,var(--primary)_16%,transparent)] px-2 py-0.5 text-[11px] font-medium text-[var(--primary)]">
                            {item.badge}
                          </span>
                        ) : null}
                      </>
                    )}
                  </Link>
                );

                if (collapsed && !mobile) {
                  return (
                    <Tooltip key={item.path}>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right" sideOffset={12}>
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return <div key={item.path}>{link}</div>;
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="rounded-[24px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--card)_72%,transparent)] p-3">
        {collapsed && !mobile ? (
          <div className="text-center text-[11px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
            IEC
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
              Compliance Mode
            </div>
            <div className="text-sm text-[var(--text-primary)]">IEC 62304 / ISO 14971</div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AppSidebar() {
  const collapsed = useWorkspaceStore((state) => state.sidebarCollapsed);
  const mobileNavOpen = useWorkspaceStore((state) => state.mobileNavOpen);
  const setMobileNavOpen = useWorkspaceStore((state) => state.setMobileNavOpen);
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[300px] border-r border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_64%,transparent)] p-0 backdrop-blur-2xl"
        >
          <SidebarContent collapsed={false} mobile />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 280 }}
      transition={{ duration: 0.24, ease: "easeInOut" }}
      className="relative hidden h-screen shrink-0 border-r border-white/10 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_70%,transparent),color-mix(in_srgb,var(--surface)_54%,transparent))] backdrop-blur-[20px] lg:block"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--primary)_14%,transparent),transparent_45%),radial-gradient(circle_at_bottom_left,color-mix(in_srgb,var(--accent)_10%,transparent),transparent_40%)]" />
      <div className="relative h-full">
        <SidebarContent collapsed={collapsed} />
      </div>
    </motion.aside>
  );
}
