"use client"

// Configuration constants for timing
const SYNC_DELAY_MS = 1000;
const SYNC_COMPLETION_MS = 2000;
const NOTIFICATION_DELAY_MS = 5000;

import React, { createContext, useContext, useState } from "react"
import { useNotifications } from "@/components/notification-context"
import type { FileSystemItem, SyncStatus } from "@/lib/types"

interface SyncContextType {
  syncPaused: boolean
  syncDialogOpen: boolean
  setSyncPaused: (paused: boolean) => void
  setSyncDialogOpen: (open: boolean) => void
  updateSyncStatus: (itemId: string, status: SyncStatus) => void
  triggerManualSync: () => void
  toggleSyncPause: () => void
}

const SyncContext = createContext<SyncContextType | undefined>(undefined)

export function SyncProvider({
  children,
  fileSystem,
  setFileSystem,
}: {
  children: React.ReactNode
  fileSystem: FileSystemItem[]
  setFileSystem: React.Dispatch<React.SetStateAction<FileSystemItem[]>>
}) {
  const [syncPaused, setSyncPaused] = useState(false)
  const [syncDialogOpen, setSyncDialogOpen] = useState(false)
  const { addNotification } = useNotifications()

  const updateSyncStatus = (itemId: string, status: SyncStatus) => {
    const updateStatus = (items: FileSystemItem[]): FileSystemItem[] => {
      return items.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            syncStatus: status,
          }
        }

        if (item.type === "folder" && item.children) {
          return {
            ...item,
            children: updateStatus(item.children),
          }
        }

        return item
      })
    }

    setFileSystem(prevFileSystem => updateStatus(prevFileSystem))
  }

  const triggerManualSync = () => {
    const pendingItems: FileSystemItem[] = []

    const findPendingItems = (items: FileSystemItem[]) => {
      items.forEach((item) => {
        if (item.syncStatus === "pending" || item.syncStatus === "error") {
          pendingItems.push(item)
        }

        if (item.type === "folder" && item.children) {
          findPendingItems(item.children)
        }
      })
    }

    findPendingItems(fileSystem)

    if (pendingItems.length === 0) {
      addNotification({
        title: "Nothing to Sync",
        message: "All files are already synced",
        type: "info",
      })
      return
    }

    addNotification({
      title: "Sync Started",
      message: `Syncing ${pendingItems.length} item(s)`,
      type: "info",
    })

    pendingItems.forEach((item) => {
      updateSyncStatus(item.id, "syncing")

      setTimeout(
        () => {
          updateSyncStatus(item.id, "synced")
        },
        SYNC_COMPLETION_MS + Math.random() * 3000,
      )
    })

    setTimeout(() => {
      addNotification({
        title: "Sync Complete",
        message: `${pendingItems.length} item(s) have been synced`,
        type: "success",
      })
    }, NOTIFICATION_DELAY_MS)
  }

  const toggleSyncPause = () => {
    const newPausedState = !syncPaused
    setSyncPaused(newPausedState)
    addNotification({
      title: newPausedState ? "Sync Paused" : "Sync Resumed",
      message: newPausedState ? "File synchronization has been paused" : "File synchronization has been resumed",
      type: "info",
    })
  }

  const value = {
    syncPaused,
    syncDialogOpen,
    setSyncPaused,
    setSyncDialogOpen,
    updateSyncStatus,
    triggerManualSync,
    toggleSyncPause
  }

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
}

export function useSync() {
  const context = useContext(SyncContext)
  if (context === undefined) {
    throw new Error("useSync must be used within a SyncProvider")
  }
  return context
}
