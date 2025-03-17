"use client"

import type React from "react"

import { createContext, useContext } from "react"
import type { FileSystemItem, SyncStatus, Permission } from "@/lib/types"

interface ClipboardItem {
  items: FileSystemItem[]
  sourcePath: string[]
  operation: "cut" | "copy"
}

interface FileSystemContextType {
  fileSystem: FileSystemItem[]
  currentPath: string[]
  selectedItems: string[]
  viewMode: "grid" | "list"
  clipboard: ClipboardItem | null
  syncPaused: boolean
  canGoBack: boolean
  canGoForward: boolean
  setSelectedItems: (items: string[]) => void
  setViewMode: (mode: "grid" | "list") => void
  navigateTo: (path: string[]) => void
  goBack: () => void
  goForward: () => void
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
  return <FileSystemContext.Provider value={value}>{children}</FileSystemContext.Provider>
}

export function useFileSystem() {
  const context = useContext(FileSystemContext)
  if (context === undefined) {
    throw new Error("useFileSystem must be used within a FileSystemProvider")
  }
  return context
}

