"use client"

import "./globals.css"
import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { NotificationProvider } from "@/components/notification-context"
import { Sidebar } from "@/components/sidebar"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { initializationService } from "@/lib/initialization"
import { SidebarProvider, useSidebar } from "@/components/contexts/sidebar-context"
import { Toaster } from "@/components/ui/toaster"

// Import metadata values
import { metadata } from './metadata'

// Create an internal layout component that can use sidebar context
function MainLayout({ children }: { children: React.ReactNode }) {
  // Access sidebar state from context
  const { sidebarOpen, setSidebarOpen } = useSidebar()

  // Run initialization once when the app starts
  useEffect(() => {
    // Run initialization only on client side
    if (typeof window !== 'undefined') {
      initializationService.initialize().catch(console.error);
    }
  }, []);

  return (
    <div className="flex h-screen">
      <div className={`fixed inset-0 z-40 md:relative md:z-0 transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } md:w-64 flex-shrink-0`}>
        <Sidebar closeSidebar={() => setSidebarOpen(false)} />
      </div>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Static title and meta tags for export */}
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          <NotificationProvider>
            <SidebarProvider>
              <MainLayout>{children}</MainLayout>
              <Toaster />
            </SidebarProvider>
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
