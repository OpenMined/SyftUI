"use client"

import { useState, useEffect } from "react"
import { FileManager } from "@/components/file-manager"
import { mockFileSystem } from "@/lib/mock-data"
import { HistoryProvider } from "@/components/history-context"
import { NotificationProvider } from "@/components/notification-context"

export default function HomePage() {
  const [fileSystem, setFileSystem] = useState(mockFileSystem)
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    // Try to get the saved view mode from localStorage
    if (typeof window !== "undefined") {
      const savedViewMode = localStorage.getItem("viewMode")
      return savedViewMode === "grid" || savedViewMode === "list" ? savedViewMode : "grid"
    }
    return "grid"
  })

  // Save view mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("viewMode", viewMode)
  }, [viewMode])

  return (
    <div className="min-h-screen bg-background">
      <HistoryProvider>
        <NotificationProvider>
          <FileManager
            fileSystem={fileSystem}
            setFileSystem={setFileSystem}
            initialViewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </NotificationProvider>
      </HistoryProvider>
    </div>
  )
}

