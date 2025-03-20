"use client"

import type React from "react"
import { createContext, useContext, useEffect } from "react"
import type { FileSystemItem, SyncStatus, Permission } from "@/lib/types"

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
    const handleNavigationEvent = (event: CustomEvent) => {
      const { path, callback } = event.detail;

      // Call the navigate function from the context
      value.navigateTo(path);

      // Call the callback if provided
      if (callback && typeof callback === 'function') {
        callback();
      }
    };

    // Add event listener with type assertion
    window.addEventListener('navigate-to-path', handleNavigationEvent as EventListener);

    // Clean up event listener
    return () => {
      window.removeEventListener('navigate-to-path', handleNavigationEvent as EventListener);
    };
  }, [value]);

  return <FileSystemContext.Provider value={value}>{children}</FileSystemContext.Provider>
}

export function useFileSystem() {
  const context = useContext(FileSystemContext)
  if (context === undefined) {
    throw new Error("useFileSystem must be used within a FileSystemProvider")
  }
  return context
}
