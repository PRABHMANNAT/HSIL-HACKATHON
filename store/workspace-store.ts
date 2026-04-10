"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type WorkspaceState = {
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  mobileNavOpen: boolean;
  recentCommandIds: string[];
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  pushRecentCommand: (id: string) => void;
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      commandPaletteOpen: false,
      mobileNavOpen: false,
      recentCommandIds: [],
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
      pushRecentCommand: (id) =>
        set((state) => ({
          recentCommandIds: [id, ...state.recentCommandIds.filter((item) => item !== id)].slice(
            0,
            6,
          ),
        })),
    }),
    {
      name: "meddevice-suite-pro-ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        recentCommandIds: state.recentCommandIds,
      }),
    },
  ),
);

