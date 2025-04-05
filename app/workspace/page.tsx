"use client"

import { useState } from "react"
import { mockFileSystem } from "@/lib/mock-data"
import { FileManager } from "@/components/workspace/file-manager"
import { getPathFromUrl, processPath } from "@/lib/utils/url"

export default function FilesPage() {
    const [initialPath] = useState(() => {
        const pathFromUrl = getPathFromUrl();
        const { dirPath } = processPath(pathFromUrl, mockFileSystem);
        return dirPath;
    })

    return (
        <div className="min-h-screen bg-background flex">
            <FileManager initialPath={initialPath} />
        </div>
    )
}