"use client"

import { create } from "zustand"

interface SidebarState {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  // Start with sidebar closed on mobile, open on desktop
  sidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 768 : false,
  
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen }))
}))
