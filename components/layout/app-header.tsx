"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, MoonStar, Search, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getBreadcrumbItems } from "@/lib/navigation";
import { getPageDefinitionFromPath } from "@/lib/page-registry";
import { useWorkspaceStore } from "@/store/workspace-store";

export function AppHeader() {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbItems(pathname);
  const page = getPageDefinitionFromPath(pathname);
  const setCommandPaletteOpen = useWorkspaceStore((state) => state.setCommandPaletteOpen);
  const setMobileNavOpen = useWorkspaceStore((state) => state.setMobileNavOpen);
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_66%,transparent)] px-4 py-3 backdrop-blur-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-full lg:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-4" />
          </Button>
          <div className="min-w-0">
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((item, index) => (
                  <div key={item.label} className="flex items-center gap-1">
                    <BreadcrumbItem>
                      {index === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={item.href}>{item.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 ? <BreadcrumbSeparator /> : null}
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
              {page.description}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            className="h-11 rounded-full border border-[var(--border)] bg-[var(--card)]/70 px-4"
            onClick={() => setCommandPaletteOpen(true)}
            aria-label="Open command palette"
          >
            <Search className="mr-2 size-4 text-[var(--text-secondary)]" />
            <span className="hidden text-[var(--text-secondary)] sm:inline">
              Global search
            </span>
            <span className="ml-3 rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">
              Cmd+K
            </span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="relative rounded-full border border-[var(--border)] bg-[var(--card)]/70"
            aria-label="Open notifications"
          >
            <Bell className="size-4" />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-[var(--danger)]" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-full border border-[var(--border)] bg-[var(--card)]/70"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? (
              <SunMedium className="size-4" />
            ) : (
              <MoonStar className="size-4" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-11 rounded-full border border-[var(--border)] bg-[var(--card)]/70 px-2">
                <Avatar className="size-8">
                  <AvatarFallback>HS</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>Biomedical Engineer</DropdownMenuItem>
              <DropdownMenuItem>Clinical Systems Owner</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Preferences</DropdownMenuItem>
              <DropdownMenuItem>Audit trail</DropdownMenuItem>
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
