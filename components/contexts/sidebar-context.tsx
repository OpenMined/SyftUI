"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

type SidebarContextType = {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Start with sidebar closed on mobile, open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Only run this on the client side
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768 // md breakpoint
    }
    return false // Default to false for SSR
  })

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev)
  }

  return (
    <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
