"use client"

import "./globals.css"
import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { FileSystemProvider } from "@/components/file-system-context"
import { HistoryProvider } from "@/components/history-context"
import { NotificationProvider } from "@/components/notification-context"
import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { usePathname, useRouter } from "next/navigation"
import { mockFileSystem } from "@/lib/mock-data"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [fileSystem, setFileSystem] = useState(mockFileSystem)

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          <FileSystemProvider value={{ fileSystem, setFileSystem }}>
            <HistoryProvider>
              <NotificationProvider>
                <div className="flex h-screen">
                  <div className={`fixed inset-0 z-40 md:relative md:z-0 transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                    } md:w-64 flex-shrink-0`}>
                    <Sidebar closeSidebar={() => setSidebarOpen(false)} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    {children}
                  </div>
                </div>
              </NotificationProvider>
            </HistoryProvider>
          </FileSystemProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
