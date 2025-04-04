"use client"

import { useState, useEffect } from "react"
import { mockFileSystem } from "@/lib/mock-data"
import { NotificationProvider } from "@/components/contexts/notification-context"
import { FileManager } from "@/components/file-manager"
import { getPathFromUrl, processPath } from "@/lib/utils/url"

export default function FilesPage() {
    const [fileSystem, setFileSystem] = useState(mockFileSystem)
    const [initialPath] = useState(() => {
        const pathFromUrl = getPathFromUrl();
        const { dirPath } = processPath(pathFromUrl, mockFileSystem);
        return dirPath;
    })
    const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
        // Try to get the saved view mode from localStorage
        if (typeof window !== "undefined") {
            const savedViewMode = localStorage.getItem("viewMode")
            return savedViewMode === "grid" || savedViewMode === "list" ? savedViewMode : "grid"
        }
        return "grid"
    })

    return (
        <div className="min-h-screen bg-background flex">
            <FileManager
                fileSystem={fileSystem}
                setFileSystem={setFileSystem}
                initialViewMode={viewMode}
                initialPath={initialPath}
                onViewModeChange={(mode) => {
                    setViewMode(mode)
                    localStorage.setItem("viewMode", mode)
                }}
            />
        </div>
    )
}