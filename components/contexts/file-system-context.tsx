"use client"

import type React from "react"
import { createContext, useContext, useEffect } from "react"
import type { FileSystemItem, SyncStatus, Permission } from "@/lib/types"
import { getPathFromUrl, processPath, findFileInPath } from "@/lib/utils/url"

export interface ClipboardItem {
  items: FileSystemItem[]
  sourcePath: string[]
  operation: "cut" | "copy"
}

export type SortOption = "name" | "date" | "size" | "type"
export type SortDirection = "asc" | "desc"

export interface SortConfig {
  sortBy: SortOption
  direction: SortDirection
}

export interface FileSystemContextType {
  fileSystem: FileSystemItem[]
  currentPath: string[]
  selectedItems: string[]
  viewMode: "grid" | "list"
  sortConfig: SortConfig
  clipboard: ClipboardItem | null
  syncPaused: boolean
  setSelectedItems: (items: string[]) => void
  setViewMode: (mode: "grid" | "list") => void
  setSortConfig: (config: SortConfig) => void
  navigateTo: (path: string[]) => void
  handleCreateFolder: (name: string) => void
  handleDelete: (itemIds: string[]) => void
  handleRename: (itemId: string, newName: string) => void
  setPreviewFile: (file: FileSystemItem | null) => void
  setDetailsItem: (item: FileSystemItem | null) => void
  moveItems: (itemIds: string[], targetPath: string[]) => void
  cutItems: (itemIds: string[]) => void
  copyItems: (itemIds: string[]) => void
  pasteItems: () => void
  updateSyncStatus: (itemId: string, status: SyncStatus) => void
  updatePermissions: (itemId: string, permissions: Permission[]) => void
  toggleSyncPause: () => void
  triggerManualSync: () => void
  refreshFileSystem: () => void
  setSyncDialogOpen: (open: boolean) => void
}

const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined)

export function FileSystemProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: FileSystemContextType
}) {
  // Set up event listener for navigation events
  useEffect(() => {
    // Define the handler for the custom navigation event
    const handleNavigationEvent = (event: Event) => {
      // Cast the event to any to access detail
      const detail = (event as any).detail;
      const path = detail?.path;
      const callback = detail?.callback;

      if (path) {
        // Call the navigate function from the context
        value.navigateTo(path);

        // Call the callback if provided
        if (callback && typeof callback === 'function') {
          callback();
        }
      }
    };

    // Add event listener with type assertion
    window.addEventListener('navigate-to-path', handleNavigationEvent);

    // Clean up event listener
    return () => {
      window.removeEventListener('navigate-to-path', handleNavigationEvent);
    };
  }, [value]);

  // Parse URL path parameter on initial load
  useEffect(() => {
    const pathSegments = getPathFromUrl();
    const { dirPath, fileName } = processPath(pathSegments, value.fileSystem);

    // First navigate to the correct directory
    if (dirPath.length > 0) {
      value.navigateTo(dirPath);
    }

    // If there's a file in the path, we need to find it and open it
    if (fileName) {
      // Find the file using our utility function
      const fileToOpen = findFileInPath(value.fileSystem, dirPath, fileName);
      if (fileToOpen) {
        // Schedule setting the preview file after the navigate completes
        setTimeout(() => {
          value.setPreviewFile(fileToOpen);
        }, 100);
      }
    }
  }, []);

  return <FileSystemContext.Provider value={value}>{children}</FileSystemContext.Provider>
}

export function useFileSystem() {
  const context = useContext(FileSystemContext)
  if (context === undefined) {
    throw new Error("useFileSystem must be used within a FileSystemProvider")
  }
  return context
}
