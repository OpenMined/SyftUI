"use client"

import React, { createContext, useContext, useState } from "react"
import { useNotifications } from "@/components/contexts/notification-context"
import { useFileOperations } from "@/components/services/file-operations"
import type { FileSystemItem, ClipboardItem } from "@/lib/types"

interface ClipboardContextType {
  clipboard: ClipboardItem | null
  cutItems: (itemIds: string[]) => void
  copyItems: (itemIds: string[]) => void
  pasteItems: () => void
}

const ClipboardContext = createContext<ClipboardContextType | undefined>(undefined)

export function ClipboardProvider({
  children,
  fileSystem,
  setFileSystem,
  currentPath,
}: {
  children: React.ReactNode
  fileSystem: FileSystemItem[]
  setFileSystem: React.Dispatch<React.SetStateAction<FileSystemItem[]>>
  currentPath: string[]
}) {
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null)
  const { addNotification } = useNotifications()
  const { findItemsByIds, moveItems, deepCloneItems } = useFileOperations(fileSystem, setFileSystem, currentPath)

  const cutItems = (itemIds: string[]) => {
    const foundItems = findItemsByIds(itemIds)
    if (foundItems.length > 0) {
      const { items, path } = foundItems[0]
      setClipboard({
        items: items,
        sourcePath: path,
        operation: "cut",
      })

      addNotification({
        title: "Items Cut",
        message: `${items.length} item(s) have been cut to clipboard`,
        type: "info",
      })
    }
  }

  const copyItems = (itemIds: string[]) => {
    const foundItems = findItemsByIds(itemIds)
    if (foundItems.length > 0) {
      const { items, path } = foundItems[0]
      setClipboard({
        items: items,
        sourcePath: path,
        operation: "copy",
      })

      addNotification({
        title: "Items Copied",
        message: `${items.length} item(s) have been copied to clipboard`,
        type: "info",
      })
    }
  }

  const pasteItems = () => {
    if (!clipboard) return

    if (clipboard.operation === "cut") {
      const itemIds = clipboard.items.map((item) => item.id)
      moveItems(itemIds, currentPath)
      setClipboard(null)
    } else {
      const clonedItems = deepCloneItems(clipboard.items)

      const addItems = (items: FileSystemItem[], path: string[], depth: number): FileSystemItem[] => {
        if (depth === path.length) {
          return [...items, ...clonedItems]
        }

        return items.map((item) => {
          if (item.type === "folder" && item.name === path[depth]) {
            return {
              ...item,
              children: addItems(item.children || [], path, depth + 1),
            }
          }
          return item
        })
      }

      setFileSystem(addItems([...fileSystem], currentPath, 0))

      addNotification({
        title: "Items Pasted",
        message: `${clonedItems.length} item(s) have been pasted`,
        type: "success",
      })
    }
  }

  const value = {
    clipboard,
    cutItems,
    copyItems,
    pasteItems,
  }

  return <ClipboardContext.Provider value={value}>{children}</ClipboardContext.Provider>
}

export function useClipboard() {
  const context = useContext(ClipboardContext)
  if (context === undefined) {
    throw new Error("useClipboard must be used within a ClipboardProvider")
  }
  return context
}
