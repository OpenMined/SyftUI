"use client"

import { useState } from "react"
import { mockFileSystem } from "@/lib/mock-data"
import { HistoryProvider } from "@/components/history-context"
import { NotificationProvider } from "@/components/notification-context"
import { FileManager } from "@/components/file-manager"

export default function FilesPage() {
    const [fileSystem, setFileSystem] = useState(mockFileSystem)
    const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
        // Try to get the saved view mode from localStorage
        if (typeof window !== "undefined") {
            const savedViewMode = localStorage.getItem("viewMode")
            return savedViewMode === "grid" || savedViewMode === "list" ? savedViewMode : "grid"
        }
        return "grid"
    })

    return (
        <div className="min-h-screen bg-background">
            <HistoryProvider>
                <NotificationProvider>
                    <FileManager
                        fileSystem={fileSystem}
                        setFileSystem={setFileSystem}
                        initialViewMode={viewMode}
                        onViewModeChange={(mode) => {
                            setViewMode(mode)
                            localStorage.setItem("viewMode", mode)
                        }}
                    />
                </NotificationProvider>
            </HistoryProvider>
        </div>
    )
}