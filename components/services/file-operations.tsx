"use client"

// Configuration constants for timing
const SYNC_DELAY_MS = 1000;
const SYNC_COMPLETION_MS = 2000;
const NOTIFICATION_DELAY_MS = 5000;

import type { FileSystemItem, SyncStatus, Permission } from "@/lib/types"
import { useNotifications, Notification } from "@/components/notification-context"
import { useSync } from "@/components/contexts/sync-context"

export function useFileOperations(
  fileSystem: FileSystemItem[],
  setFileSystem: React.Dispatch<React.SetStateAction<FileSystemItem[]>>,
  currentPath: string[],
  notificationService?: { addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void },
  syncService?: { updateSyncStatus: (id: string, status: SyncStatus) => void }
) {
  // Use injected services if provided, otherwise use hooks
  const defaultNotifications = useNotifications()
  const defaultSync = useSync()

  const { addNotification } = notificationService || defaultNotifications
  const { updateSyncStatus } = syncService || defaultSync

  const findItemById = (itemId: string, items: FileSystemItem[] = fileSystem): FileSystemItem | null => {
    for (const item of items) {
      if (item.id === itemId) {
        return item
      }

      if (item.type === "folder" && item.children) {
        const found = findItemById(itemId, item.children)
        if (found) return found
      }
    }

    return null
  }

  const findItemsByIds = (
    itemIds: string[],
    items: FileSystemItem[] = fileSystem,
    path: string[] = [],
  ): { items: FileSystemItem[]; path: string[] }[] => {
    const result: { items: FileSystemItem[]; path: string[] }[] = []

    for (const item of items) {
      if (itemIds.includes(item.id)) {
        result.push({ items: [item], path })
      }

      if (item.type === "folder" && item.children) {
        const childResults = findItemsByIds(itemIds, item.children, [...path, item.name])
        result.push(...childResults)
      }
    }

    return result
  }

  const handleCreateFolder = (name: string) => {
    try {
      const newFolder: FileSystemItem = {
        id: `folder-${Date.now()}`,
        name,
        type: "folder",
        children: [],
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        syncStatus: "pending",
      }

      if (currentPath.length === 0) {
        setFileSystem(prevState => [...prevState, newFolder])
      } else {
        const updateFileSystem = (items: FileSystemItem[], path: string[], depth: number): FileSystemItem[] => {
          if (depth === path.length) {
            return [...items, newFolder]
          }

          return items.map((item) => {
            if (item.type === "folder" && item.name === path[depth]) {
              return {
                ...item,
                children: updateFileSystem(item.children || [], path, depth + 1),
              }
            }
            return item
          })
        }

        setFileSystem(prevState => updateFileSystem(prevState, currentPath, 0))
      }

      setTimeout(() => {
        updateSyncStatus(newFolder.id, "syncing")

        setTimeout(() => {
          updateSyncStatus(newFolder.id, "synced")
          addNotification({
            title: "Folder Created",
            message: `Folder "${name}" has been created and synced`,
            type: "success",
          })
        }, SYNC_COMPLETION_MS)
      }, SYNC_DELAY_MS)
    } catch (error) {
      console.error("Error creating folder:", error);
      addNotification({
        title: "Error Creating Folder",
        message: `Failed to create folder "${name}". Please try again.`,
        type: "error",
      });
    }
  }

  const handleDelete = (itemIds: string[], setSelectedItems?: React.Dispatch<React.SetStateAction<string[]>>, setDetailsItem?: React.Dispatch<React.SetStateAction<FileSystemItem | null>>) => {
    try {
      const itemsToDelete: FileSystemItem[] = []
      const findItems = (items: FileSystemItem[]): FileSystemItem[] => {
        return items.filter((item) => {
          if (itemIds.includes(item.id)) {
            itemsToDelete.push(item)
            return false
          }

          if (item.type === "folder" && item.children) {
            item.children = findItems(item.children)
          }

          return true
        })
      }

      setFileSystem(prevState => findItems([...prevState]))

      if (setSelectedItems) {
        setSelectedItems([])
      }

      if (setDetailsItem) {
        const detailsItem = itemsToDelete.length > 0 ? itemsToDelete[0] : null
        if (detailsItem && itemIds.includes(detailsItem.id)) {
          setDetailsItem(null)
        }
      }

      addNotification({
        title: "Items Deleted",
        message: `${itemsToDelete.length} item(s) have been deleted`,
        type: "info",
      })
    } catch (error) {
      console.error("Error deleting items:", error);
      addNotification({
        title: "Error Deleting Items",
        message: "Failed to delete items. Please try again.",
        type: "error",
      });
    }
  }

  const handleRename = (itemId: string, newName: string, setDetailsItem?: React.Dispatch<React.SetStateAction<FileSystemItem | null>>) => {
    try {
      let oldName = ""

      const renameItem = (items: FileSystemItem[]): FileSystemItem[] => {
        return items.map((item) => {
          if (item.id === itemId) {
            oldName = item.name
            return {
              ...item,
              name: newName,
              modifiedAt: new Date().toISOString(),
              syncStatus: "pending",
            }
          }

          if (item.type === "folder" && item.children) {
            return {
              ...item,
              children: renameItem(item.children),
            }
          }

          return item
        })
      }

      setFileSystem(prevState => renameItem(prevState))

      if (setDetailsItem) {
        const detailsItem = findItemById(itemId)
        if (detailsItem && detailsItem.id === itemId) {
          setDetailsItem({
            ...detailsItem,
            name: newName,
            modifiedAt: new Date().toISOString(),
            syncStatus: "pending",
          })
        }
      }

      setTimeout(() => {
        updateSyncStatus(itemId, "syncing")

        setTimeout(() => {
          updateSyncStatus(itemId, "synced")
          addNotification({
            title: "Item Renamed",
            message: `"${oldName}" has been renamed to "${newName}"`,
            type: "success",
          })
        }, SYNC_COMPLETION_MS)
      }, SYNC_DELAY_MS)
    } catch (error) {
      console.error("Error renaming item:", error);
      addNotification({
        title: "Error Renaming Item",
        message: "Failed to rename item. Please try again.",
        type: "error",
      });
    }
  }

  const moveItems = (itemIds: string[], targetPath: string[], setDetailsItem?: React.Dispatch<React.SetStateAction<FileSystemItem | null>>) => {
    try {
      const itemsToMove: FileSystemItem[] = []
      let sourcePath: string[] = []

      const removeItems = (items: FileSystemItem[], path: string[] = []): FileSystemItem[] => {
        const remainingItems = items.filter((item) => {
          if (itemIds.includes(item.id)) {
            itemsToMove.push({ ...item, syncStatus: "pending" })
            sourcePath = path
            return false
          }
          return true
        })

        return remainingItems.map((item) => {
          if (item.type === "folder" && item.children) {
            return {
              ...item,
              children: removeItems(item.children, [...path, item.name]),
            }
          }
          return item
        })
      }

      const addItems = (items: FileSystemItem[], path: string[], depth: number): FileSystemItem[] => {
        if (depth === path.length) {
          return [...items, ...itemsToMove]
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

      setFileSystem(prevState => {
        const newFileSystem = removeItems([...prevState])
        return addItems(newFileSystem, targetPath, 0)
      })

      if (setDetailsItem) {
        const detailsItem = itemsToMove.length > 0 ? itemsToMove[0] : null
        if (detailsItem && itemIds.includes(detailsItem.id)) {
          setDetailsItem(null)
        }
      }

      itemsToMove.forEach((item) => {
        setTimeout(() => {
          updateSyncStatus(item.id, "syncing")

          setTimeout(() => {
            updateSyncStatus(item.id, "synced")
          }, SYNC_COMPLETION_MS)
        }, SYNC_DELAY_MS)
      })

      addNotification({
        title: "Items Moved",
        message: `${itemsToMove.length} item(s) have been moved`,
        type: "success",
      })
    } catch (error) {
      console.error("Error moving items:", error);
      addNotification({
        title: "Error Moving Items",
        message: "Failed to move items. Please try again.",
        type: "error",
      });
    }
  }

  const deepCloneItems = (items: FileSystemItem[]): FileSystemItem[] => {
    return items.map((item) => {
      const newItem = { ...item, id: `${item.id}-copy-${Date.now()}`, syncStatus: "pending" }

      if (item.type === "folder" && item.children) {
        newItem.children = deepCloneItems(item.children)
      }

      return newItem
    })
  }

  const updatePermissions = (itemId: string, permissions: Permission[]) => {
    try {
      const updateItemPermissions = (items: FileSystemItem[]): FileSystemItem[] => {
        return items.map((item) => {
          if (item.id === itemId) {
            return {
              ...item,
              permissions: permissions,
            }
          }

          if (item.type === "folder" && item.children) {
            return {
              ...item,
              children: updateItemPermissions(item.children),
            }
          }

          return item
        })
      }

      setFileSystem(prevState => updateItemPermissions(prevState))

      addNotification({
        title: "Permissions Updated",
        message: `Permissions for "${findItemById(itemId)?.name}" have been updated`,
        type: "success",
      })
    } catch (error) {
      console.error("Error updating permissions:", error);
      addNotification({
        title: "Error Updating Permissions",
        message: "Failed to update permissions. Please try again.",
        type: "error",
      });
    }
  }

  return {
    findItemById,
    findItemsByIds,
    handleCreateFolder,
    handleDelete,
    handleRename,
    moveItems,
    deepCloneItems,
    updatePermissions,
  }
}
