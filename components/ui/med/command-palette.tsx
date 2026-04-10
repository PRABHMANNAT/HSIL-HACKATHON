"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { CommandIcon, FileSearch, FolderOpen, Sparkles } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { commandActions, recentProjects } from "@/lib/mock-data";
import { getCommandablePages } from "@/lib/navigation";
import { fuzzyScore } from "@/lib/fuzzy";
import { useWorkspaceStore } from "@/store/workspace-store";

function sortByQuery<T extends { label: string; description?: string }>(items: T[], query: string) {
  return items
    .map((item) => ({
      item,
      score: Math.max(
        fuzzyScore(item.label, query),
        item.description ? fuzzyScore(item.description, query) : -1,
      ),
    }))
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => right.score - left.score)
    .map((entry) => entry.item);
}

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const open = useWorkspaceStore((state) => state.commandPaletteOpen);
  const setOpen = useWorkspaceStore((state) => state.setCommandPaletteOpen);
  const pushRecentCommand = useWorkspaceStore((state) => state.pushRecentCommand);
  const toggleSidebar = useWorkspaceStore((state) => state.toggleSidebar);
  const recentCommandIds = useWorkspaceStore((state) => state.recentCommandIds);

  const [query, setQuery] = React.useState("");
  const deferredQuery = React.useDeferredValue(query);

  const pages = getCommandablePages().filter((page) => page.path !== pathname);
  const actionItems = commandActions.map((action) => ({
    ...action,
    type: "action" as const,
  }));
  const projectItems = recentProjects.map((project) => ({
    ...project,
    type: "project" as const,
    description: `Jump into ${project.section}`,
  }));
  const recentLookup = [...pages, ...actionItems, ...projectItems];
  const recentItems = recentCommandIds
    .map((id) => recentLookup.find((item) => item.id === id))
    .filter((item): item is (typeof recentLookup)[number] => Boolean(item));

  const pageResults = deferredQuery ? sortByQuery(pages, deferredQuery) : pages;
  const actionResults = deferredQuery ? sortByQuery(actionItems, deferredQuery) : actionItems;
  const projectResults = deferredQuery ? sortByQuery(projectItems, deferredQuery) : projectItems;

  React.useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      const shortcutPressed = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      const toggleSidebarPressed =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b";

      if (shortcutPressed) {
        event.preventDefault();
        setOpen(!open);
      }

      if (toggleSidebarPressed) {
        event.preventDefault();
        toggleSidebar();
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [open, setOpen, toggleSidebar]);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  function handleNavigation(id: string, path: string) {
    pushRecentCommand(id);
    setOpen(false);
    React.startTransition(() => {
      router.push(path);
    });
  }

  function handleAction(id: string) {
    pushRecentCommand(id);

    if (id === "toggle-sidebar") {
      toggleSidebar();
      setOpen(false);
      return;
    }

    if (id === "new-risk-review") {
      setOpen(false);
      React.startTransition(() => {
        router.push("/risk");
      });
      return;
    }

    setOpen(true);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="h-[calc(100vh-24px)] max-w-[calc(100vw-24px)] gap-0 overflow-hidden rounded-[34px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--card)_92%,transparent),color-mix(in_srgb,var(--surface)_78%,transparent))] p-0 shadow-[0_40px_120px_rgba(4,9,20,0.42)] backdrop-blur-2xl"
      >
        <div className="border-b border-[var(--border)] px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                <CommandIcon className="size-4 text-[var(--primary)]" />
                MedDevice Command Palette
              </div>
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                Search pages, actions, and live programs
              </div>
            </div>
            <div className="rounded-full border border-[var(--border)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
              Ctrl/Cmd + K
            </div>
          </div>
        </div>
        <Command shouldFilter={false} className="h-full bg-transparent p-0">
          <div className="border-b border-[var(--border)] p-4">
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Search design controls, pages, and actions..."
              className="h-12 text-base"
              aria-label="Search command palette"
            />
          </div>
          <CommandList className="max-h-full flex-1 px-4 py-4">
            {!deferredQuery && recentItems.length ? (
              <CommandGroup heading="Recent">
                {recentItems.map((item) => (
                  <CommandItem
                    key={`recent-${item.id}`}
                    value={item.label}
                    onSelect={() => {
                      if ("path" in item) {
                        handleNavigation(item.id, item.path);
                      } else {
                        handleAction(item.id);
                      }
                    }}
                    className="rounded-2xl px-4 py-3"
                  >
                    <Sparkles className="size-4 text-[var(--primary)]" />
                    <div className="flex flex-col gap-1">
                      <span>{item.label}</span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {"description" in item && item.description
                          ? item.description
                          : "Recent command"}
                      </span>
                    </div>
                  </CommandItem>
                ))}
                <CommandSeparator />
              </CommandGroup>
            ) : null}

            <CommandGroup heading="Pages">
              {pageResults.map((page) => (
                <CommandItem
                  key={page.id}
                  value={`${page.label} ${page.description}`}
                  onSelect={() => handleNavigation(page.id, page.path)}
                  className="rounded-2xl px-4 py-3"
                >
                  <page.icon className="size-4 text-[var(--primary)]" />
                  <div className="flex min-w-0 flex-col gap-1">
                    <span>{page.label}</span>
                    <span className="truncate text-xs text-[var(--text-secondary)]">
                      {page.description}
                    </span>
                  </div>
                  <CommandShortcut>{page.section}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Actions">
              {actionResults.map((action) => (
                <CommandItem
                  key={action.id}
                  value={`${action.label} ${action.description}`}
                  onSelect={() => handleAction(action.id)}
                  className="rounded-2xl px-4 py-3"
                >
                  <FileSearch className="size-4 text-[var(--accent)]" />
                  <div className="flex min-w-0 flex-col gap-1">
                    <span>{action.label}</span>
                    <span className="truncate text-xs text-[var(--text-secondary)]">
                      {action.description}
                    </span>
                  </div>
                  <CommandShortcut>{action.shortcut}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Projects">
              {projectResults.map((project) => (
                <CommandItem
                  key={project.id}
                  value={`${project.label} ${project.section}`}
                  onSelect={() => handleNavigation(project.id, project.path)}
                  className="rounded-2xl px-4 py-3"
                >
                  <FolderOpen className="size-4 text-[var(--warning)]" />
                  <div className="flex min-w-0 flex-col gap-1">
                    <span>{project.label}</span>
                    <span className="text-xs text-[var(--text-secondary)]">{project.section}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            {!pageResults.length && !actionResults.length && !projectResults.length ? (
              <CommandEmpty>No results found for this clinical workspace query.</CommandEmpty>
            ) : null}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
