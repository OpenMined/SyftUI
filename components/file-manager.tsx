"use client"

import { cn } from "@/lib/utils"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Sidebar } from "@/components/sidebar"
import { FileExplorer } from "@/components/file-explorer"
import { Breadcrumb } from "@/components/breadcrumb"
import { Toolbar } from "@/components/toolbar"
import { FilePreview } from "@/components/file-preview"
import { FileSystemProvider } from "@/components/file-system-context"
import { FileDetails } from "@/components/file-details"
import { useHistory } from "@/components/history-context"
import { useNotifications } from "@/components/notification-context"
import { UploadProgress } from "@/components/upload-progress"
import { FileConflictDialog } from "@/components/file-conflict-dialog"
import { SyncStatusDialog } from "@/components/sync-status-dialog"
import { Marketplace } from "@/components/marketplace"
import { MarketplaceAppDetail } from "@/components/marketplace-app-detail"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import type { FileSystemItem, SyncStatus, Permission } from "@/lib/types"

interface FileManagerProps {
  fileSystem: FileSystemItem[]
  setFileSystem: React.Dispatch<React.SetStateAction<FileSystemItem[]>>
  initialViewMode: "grid" | "list"
  onViewModeChange: (mode: "grid" | "list") => void
}

interface ClipboardItem {
  items: FileSystemItem[]
  sourcePath: string[]
  operation: "cut" | "copy"
}

interface UploadItem {
  id: string
  name: string
  progress: number
  size: number
  status: "uploading" | "completed" | "error"
}

interface ConflictItem {
  file: File
  existingItem: FileSystemItem
  path: string[]
}

export function FileManager({ fileSystem, setFileSystem, initialViewMode, onViewModeChange }: FileManagerProps) {
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">(initialViewMode)
  const [previewFile, setPreviewFile] = useState<FileSystemItem | null>(null)
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null)
  const [detailsItem, setDetailsItem] = useState<FileSystemItem | null>(null)
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [conflicts, setConflicts] = useState<ConflictItem[]>([])
  const [syncDialogOpen, setSyncDialogOpen] = useState(false)
  const [syncPaused, setSyncPaused] = useState(false)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [activeView, setActiveView] = useState<"files" | "marketplace">("files")
  const [selectedMarketplaceApp, setSelectedMarketplaceApp] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const { addOperation, undo, redo } = useHistory()
  const { addNotification } = useNotifications()
  const fileManagerRef = useRef<HTMLDivElement>(null)

  // Add to the FileManager component state
  const [navigationHistory, setNavigationHistory] = useState<string[][]>([])
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1)
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)

  const closePreview = () => setPreviewFile(null)

  // Get current directory information for the details sidebar
  const getCurrentDirectoryInfo = useCallback(() => {
    // If at root, create a special Workspace directory info
    if (currentPath.length === 0) {
      return {
        id: "root-directory",
        name: "Workspace Directory",
        type: "folder" as const,
        children: getCurrentItems(),
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        syncStatus: "synced" as const,
        size: getCurrentItems().reduce((total, item) => total + (item.size || 0), 0),
      };
    }

    // Find the current directory in the file system
    let current = fileSystem;
    let currentDir: FileSystemItem | null = null;

    for (let i = 0; i < currentPath.length; i++) {
      const segment = currentPath[i];
      const folder = current.find(item => item.type === "folder" && item.name === segment);

      if (folder && folder.type === "folder" && folder.children) {
        current = folder.children;
        if (i === currentPath.length - 1) {
          currentDir = folder;
        }
      } else {
        return null;
      }
    }

    return currentDir;
  }, [currentPath, fileSystem]);

  // Update detailsItem with directory info when no item is selected
  const updateDetailsWithDirectory = useCallback(() => {
    if (selectedItems.length === 0) {
      const dirInfo = getCurrentDirectoryInfo();
      setDetailsItem(dirInfo);
    }
  }, [selectedItems, getCurrentDirectoryInfo]);

  // Initialize directory details and update when path changes
  useEffect(() => {
    updateDetailsWithDirectory();
  }, [currentPath, updateDetailsWithDirectory]);

  // Update selectedItems to ensure details sidebar stays open
  const handleSelectedItemsChange = (items: string[]) => {
    setSelectedItems(items);
    if (items.length === 0) {
      // Show directory details when nothing is selected
      updateDetailsWithDirectory();
    } else {
      // Show details for the selected item
      const selectedItem = findItemById(items[0]);
      if (selectedItem) {
        setDetailsItem(selectedItem);
      }
    }
  };

  const navigateTo = (path: string[]) => {
    // Add to navigation history
    if (currentHistoryIndex >= 0) {
      // If we're navigating from a point in history, truncate the future history
      const newHistory = navigationHistory.slice(0, currentHistoryIndex + 1)
      setNavigationHistory([...newHistory, path])
      setCurrentHistoryIndex(newHistory.length)
    } else {
      // First navigation
      setNavigationHistory([path])
      setCurrentHistoryIndex(0)
    }

    setCurrentPath(path)
    setSelectedItems([])
    setDetailsItem(null)

    // Update navigation buttons state
    setCanGoBack(currentHistoryIndex >= 0)
    setCanGoForward(false)
  }

  const goBack = () => {
    if (currentHistoryIndex > 0) {
      const newIndex = currentHistoryIndex - 1
      setCurrentHistoryIndex(newIndex)
      setCurrentPath(navigationHistory[newIndex])
      setSelectedItems([])
      setDetailsItem(null)

      // Update navigation buttons state
      setCanGoBack(newIndex > 0)
      setCanGoForward(true)
    }
  }

  const goForward = () => {
    if (currentHistoryIndex < navigationHistory.length - 1) {
      const newIndex = currentHistoryIndex + 1
      setCurrentHistoryIndex(newIndex)
      setCurrentPath(navigationHistory[newIndex])
      setSelectedItems([])
      setDetailsItem(null)

      // Update navigation buttons state
      setCanGoBack(true)
      setCanGoForward(newIndex < navigationHistory.length - 1)
    }
  }

  // Update view mode when it changes
  useEffect(() => {
    onViewModeChange(viewMode)
  }, [viewMode, onViewModeChange])

  const getCurrentItems = (): FileSystemItem[] => {
    let current = fileSystem

    for (const segment of currentPath) {
      const folder = current.find((item) => item.type === "folder" && item.name === segment)
      if (folder && folder.type === "folder" && folder.children) {
        current = folder.children
      } else {
        return []
      }
    }

    return current
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
    const newFolder: FileSystemItem = {
      id: `folder-${Date.now()}`,
      name,
      type: "folder",
      children: [],
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      syncStatus: "pending",
    }

    // Add to history for undo/redo
    addOperation({
      type: "CREATE_FOLDER",
      folder: newFolder,
      path: currentPath,
    })

    if (currentPath.length === 0) {
      setFileSystem([...fileSystem, newFolder])
      return
    }

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

    setFileSystem(updateFileSystem(fileSystem, currentPath, 0))

    // Simulate sync status changes
    setTimeout(() => {
      updateSyncStatus(newFolder.id, "syncing")

      setTimeout(() => {
        updateSyncStatus(newFolder.id, "synced")
        addNotification({
          title: "Folder Created",
          message: `Folder "${name}" has been created and synced`,
          type: "success",
        })
      }, 2000)
    }, 1000)
  }

  const handleDelete = (itemIds: string[]) => {
    // Find the items to be deleted for history
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

    // Add to history for undo/redo
    addOperation({
      type: "DELETE",
      items: itemsToDelete,
      path: currentPath,
    })

    setFileSystem(findItems([...fileSystem]))
    setSelectedItems([])

    // Close details panel if the selected item is deleted
    if (detailsItem && itemIds.includes(detailsItem.id)) {
      setDetailsItem(null)
    }

    addNotification({
      title: "Items Deleted",
      message: `${itemsToDelete.length} item(s) have been deleted`,
      type: "info",
    })
  }

  const handleRename = (itemId: string, newName: string) => {
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

    // Add to history for undo/redo
    const itemToRename = findItemById(itemId)
    if (itemToRename) {
      addOperation({
        type: "RENAME",
        item: itemToRename,
        oldName: itemToRename.name,
        newName,
        path: currentPath,
      })
    }

    setFileSystem(renameItem(fileSystem))

    // Update details panel if the renamed item is selected
    if (detailsItem && detailsItem.id === itemId) {
      setDetailsItem({
        ...detailsItem,
        name: newName,
        modifiedAt: new Date().toISOString(),
        syncStatus: "pending",
      })
    }

    // Simulate sync status changes
    setTimeout(() => {
      updateSyncStatus(itemId, "syncing")

      setTimeout(() => {
        updateSyncStatus(itemId, "synced")
        addNotification({
          title: "Item Renamed",
          message: `"${oldName}" has been renamed to "${newName}"`,
          type: "success",
        })
      }, 2000)
    }, 1000)
  }

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

  const moveItems = (itemIds: string[], targetPath: string[]) => {
    // First, find and extract the items to move
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

    // Then, add the items to the target location
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

    // Add to history for undo/redo
    addOperation({
      type: "MOVE",
      items: [...itemsToMove],
      sourcePath,
      targetPath,
    })

    // Execute the move operation
    const newFileSystem = removeItems([...fileSystem])
    setFileSystem(addItems(newFileSystem, targetPath, 0))

    // Close details panel if the moved item is selected
    if (detailsItem && itemIds.includes(detailsItem.id)) {
      setDetailsItem(null)
    }

    // Simulate sync status changes for moved items
    itemsToMove.forEach((item) => {
      setTimeout(() => {
        updateSyncStatus(item.id, "syncing")

        setTimeout(() => {
          updateSyncStatus(item.id, "synced")
        }, 2000)
      }, 1000)
    })

    addNotification({
      title: "Items Moved",
      message: `${itemsToMove.length} item(s) have been moved`,
      type: "success",
    })
  }

  const cutItems = (itemIds: string[]) => {
    const foundItems = findItemsByIds(itemIds)
    if (foundItems.length > 0) {
      // Use the first found path (in case items are in different locations)
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
      // Use the first found path (in case items are in different locations)
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

  const deepCloneItems = (items: FileSystemItem[]): FileSystemItem[] => {
    return items.map((item) => {
      const newItem = { ...item, id: `${item.id}-copy-${Date.now()}`, syncStatus: "pending" }

      if (item.type === "folder" && item.children) {
        newItem.children = deepCloneItems(item.children)
      }

      return newItem
    })
  }

  const pasteItems = () => {
    if (!clipboard) return

    if (clipboard.operation === "cut") {
      // For cut operation, move the items
      const itemIds = clipboard.items.map((item) => item.id)
      moveItems(itemIds, currentPath)
      setClipboard(null)
    } else {
      // For copy operation, clone the items
      const clonedItems = deepCloneItems(clipboard.items)

      // Add to history for undo/redo
      addOperation({
        type: "COPY",
        items: clonedItems,
        sourcePath: clipboard.sourcePath,
        targetPath: currentPath,
      })

      // Add the cloned items to the current path
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

      // Simulate sync status changes for copied items
      clonedItems.forEach((item) => {
        setTimeout(() => {
          updateSyncStatus(item.id, "syncing")

          setTimeout(() => {
            updateSyncStatus(item.id, "synced")
          }, 2000)
        }, 1000)
      })

      addNotification({
        title: "Items Pasted",
        message: `${clonedItems.length} item(s) have been pasted`,
        type: "success",
      })
    }
  }

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

    setFileSystem(updateStatus(fileSystem))

    // Update details panel if the updated item is selected
    if (detailsItem && detailsItem.id === itemId) {
      setDetailsItem({
        ...detailsItem,
        syncStatus: status,
      })
    }
  }

  const updatePermissions = (itemId: string, permissions: Permission[]) => {
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

    setFileSystem(updateItemPermissions(fileSystem))

    // Update details panel if the updated item is selected
    if (detailsItem && detailsItem.id === itemId) {
      setDetailsItem({
        ...detailsItem,
        permissions: permissions,
      })
    }

    addNotification({
      title: "Permissions Updated",
      message: `Permissions for "${findItemById(itemId)?.name}" have been updated`,
      type: "success",
    })
  }

  // Handle keyboard shortcuts for cut, copy, paste, undo, redo
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === "x" && selectedItems.length > 0) {
          e.preventDefault()
          cutItems(selectedItems)
        } else if (e.key === "c" && selectedItems.length > 0) {
          e.preventDefault()
          copyItems(selectedItems)
        } else if (e.key === "v" && clipboard) {
          e.preventDefault()
          pasteItems()
        } else if (e.key === "z") {
          e.preventDefault()
          // Handle undo
          const operation = undo()
          if (operation) {
            // Implement undo logic based on operation type
            handleUndo(operation)
          }
        } else if (e.key === "y" || (e.shiftKey && e.key === "Z")) {
          e.preventDefault()
          // Handle redo
          const operation = redo()
          if (operation) {
            // Implement redo logic based on operation type
            handleRedo(operation)
          }
        }
      }
    },
    [selectedItems, clipboard, currentPath, undo, redo],
  )

  // Implement undo/redo handlers
  const handleUndo = (operation: any) => {
    // Implement undo logic based on operation type
    switch (operation.type) {
      case "CREATE_FOLDER":
        handleDelete([operation.folder.id])
        break
      case "DELETE":
        // Restore deleted items
        restoreItems(operation.items, operation.path)
        break
      case "RENAME":
        handleRename(operation.item.id, operation.oldName)
        break
      case "MOVE":
        // Move items back to source path
        const itemIds = operation.items.map((item: FileSystemItem) => item.id)
        moveItems(itemIds, operation.sourcePath)
        break
      case "COPY":
        // Delete copied items
        const copyIds = operation.items.map((item: FileSystemItem) => item.id)
        handleDelete(copyIds)
        break
      case "UPLOAD":
        // Delete uploaded files
        const uploadIds = operation.files.map((file: FileSystemItem) => file.id)
        handleDelete(uploadIds)
        break
    }
  }

  const handleRedo = (operation: any) => {
    // Implement redo logic based on operation type
    switch (operation.type) {
      case "CREATE_FOLDER":
        // Re-create the folder
        if (operation.path.length === 0) {
          setFileSystem([...fileSystem, operation.folder])
        } else {
          const addFolder = (items: FileSystemItem[], path: string[], depth: number): FileSystemItem[] => {
            if (depth === path.length) {
              return [...items, operation.folder]
            }
            return items.map((item) => {
              if (item.type === "folder" && item.name === path[depth]) {
                return {
                  ...item,
                  children: addFolder(item.children || [], path, depth + 1),
                }
              }
              return item
            })
          }
          setFileSystem(addFolder([...fileSystem], operation.path, 0))
        }
        break
      case "DELETE":
        // Delete the items again
        const deleteIds = operation.items.map((item: FileSystemItem) => item.id)
        handleDelete(deleteIds)
        break
      case "RENAME":
        // Rename the item again
        handleRename(operation.item.id, operation.newName)
        break
      case "MOVE":
        // Move items to target path again
        const moveIds = operation.items.map((item: FileSystemItem) => item.id)
        moveItems(moveIds, operation.targetPath)
        break
      case "COPY":
        // Re-copy the items
        const addCopiedItems = (items: FileSystemItem[], path: string[], depth: number): FileSystemItem[] => {
          if (depth === path.length) {
            return [...items, ...operation.items]
          }
          return items.map((item) => {
            if (item.type === "folder" && item.name === path[depth]) {
              return {
                ...item,
                children: addCopiedItems(item.children || [], path, depth + 1),
              }
            }
            return item
          })
        }
        setFileSystem(addCopiedItems([...fileSystem], operation.targetPath, 0))
        break
      case "UPLOAD":
        // Re-upload the files
        const addUploadedFiles = (items: FileSystemItem[], path: string[], depth: number): FileSystemItem[] => {
          if (depth === path.length) {
            return [...items, ...operation.files]
          }
          return items.map((item) => {
            if (item.type === "folder" && item.name === path[depth]) {
              return {
                ...item,
                children: addUploadedFiles(item.children || [], path, depth + 1),
              }
            }
            return item
          })
        }
        setFileSystem(addUploadedFiles([...fileSystem], operation.path, 0))
        break
    }
  }

  const restoreItems = (items: FileSystemItem[], path: string[]) => {
    const addItems = (currentItems: FileSystemItem[], currentPath: string[], depth: number): FileSystemItem[] => {
      if (depth === path.length) {
        return [...currentItems, ...items]
      }

      return currentItems.map((item) => {
        if (item.type === "folder" && item.name === currentPath[depth]) {
          return {
            ...item,
            children: addItems(item.children || [], currentPath, depth + 1),
          }
        }
        return item
      })
    }

    setFileSystem(addItems([...fileSystem], path, 0))
  }

  // Add keyboard shortcut event listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

  // Handle file drops from OS
  const handleExternalFileDrop = useCallback(
    (files: FileList) => {
      // Check for name conflicts
      const currentItems = getCurrentItems()
      const conflicts: ConflictItem[] = []
      const nonConflictingFiles: File[] = []

      Array.from(files).forEach((file) => {
        const existingItem = currentItems.find((item) => item.name === file.name)
        if (existingItem) {
          conflicts.push({
            file,
            existingItem,
            path: currentPath,
          })
        } else {
          nonConflictingFiles.push(file)
        }
      })

      // Set conflicts for resolution
      if (conflicts.length > 0) {
        setConflicts(conflicts)
      }

      // Process non-conflicting files
      if (nonConflictingFiles.length > 0) {
        processFiles(nonConflictingFiles)
      }
    },
    [currentPath, fileSystem],
  )

  const processFiles = (files: File[]) => {
    // Create upload progress items
    const uploadItems: UploadItem[] = files.map((file) => ({
      id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: file.name,
      progress: 0,
      size: file.size,
      status: "uploading",
    }))

    setUploads((prev) => [...prev, ...uploadItems])

    // Simulate upload progress
    uploadItems.forEach((item) => {
      const interval = setInterval(() => {
        setUploads((prev) =>
          prev.map((upload) => {
            if (upload.id === item.id) {
              const newProgress = Math.min(upload.progress + 10, 100)
              if (newProgress === 100) {
                clearInterval(interval)
                return { ...upload, progress: newProgress, status: "completed" }
              }
              return { ...upload, progress: newProgress }
            }
            return upload
          }),
        )
      }, 300)
    })

    // Create file system items
    const newFiles: FileSystemItem[] = files.map((file) => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: file.name,
      type: "file",
      size: file.size,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      syncStatus: "pending",
    }))

    // Add to history for undo/redo
    addOperation({
      type: "UPLOAD",
      files: newFiles,
      path: currentPath,
    })

    // Add the files to the current path
    const addFiles = (items: FileSystemItem[], path: string[], depth: number): FileSystemItem[] => {
      if (depth === path.length) {
        return [...items, ...newFiles]
      }

      return items.map((item) => {
        if (item.type === "folder" && item.name === path[depth]) {
          return {
            ...item,
            children: addFiles(item.children || [], path, depth + 1),
          }
        }
        return item
      })
    }

    setFileSystem(addFiles([...fileSystem], currentPath, 0))

    // Simulate sync status changes
    newFiles.forEach((file) => {
      setTimeout(() => {
        updateSyncStatus(file.id, "syncing")

        setTimeout(() => {
          updateSyncStatus(file.id, "synced")
        }, 2000)
      }, 1000)
    })

    // Clean up completed uploads after a delay
    setTimeout(() => {
      setUploads((prev) => prev.filter((upload) => upload.status !== "completed"))
    }, 5000)

    addNotification({
      title: "Files Uploaded",
      message: `${files.length} file(s) have been uploaded`,
      type: "success",
    })
  }

  const handleConflictResolution = (resolution: "replace" | "rename" | "skip", conflict: ConflictItem) => {
    if (resolution === "replace") {
      // Delete the existing item
      handleDelete([conflict.existingItem.id])
      // Process the file
      processFiles([conflict.file])
    } else if (resolution === "rename") {
      // Generate a new name
      const nameParts = conflict.file.name.split(".")
      const extension = nameParts.length > 1 ? nameParts.pop() : ""
      const baseName = nameParts.join(".")
      const newName = `${baseName} (copy)${extension ? `.${extension}` : ""}`

      // Create a new file with the new name
      const newFile = new File([conflict.file], newName, { type: conflict.file.type })
      processFiles([newFile])
    }

    // Remove the conflict
    setConflicts((prev) => prev.filter((c) => c.file !== conflict.file))
  }

  const handleApplyToAll = (resolution: "replace" | "rename" | "skip") => {
    if (resolution === "replace") {
      // Delete all existing items
      const itemIds = conflicts.map((conflict) => conflict.existingItem.id)
      handleDelete(itemIds)
      // Process all files
      const files = conflicts.map((conflict) => conflict.file)
      processFiles(files)
    } else if (resolution === "rename") {
      // Rename and process all files
      const files = conflicts.map((conflict) => {
        const nameParts = conflict.file.name.split(".")
        const extension = nameParts.length > 1 ? nameParts.pop() : ""
        const baseName = nameParts.join(".")
        const newName = `${baseName} (copy)${extension ? `.${extension}` : ""}`
        return new File([conflict.file], newName, { type: conflict.file.type })
      })
      processFiles(files)
    }

    // Clear all conflicts
    setConflicts([])
  }

  const toggleSyncPause = () => {
    setSyncPaused(!syncPaused)
    addNotification({
      title: syncPaused ? "Sync Resumed" : "Sync Paused",
      message: syncPaused ? "File synchronization has been resumed" : "File synchronization has been paused",
      type: "info",
    })
  }

  const triggerManualSync = () => {
    // Find all items with pending sync status
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

    // Simulate syncing
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
        2000 + Math.random() * 3000,
      )
    })

    setTimeout(() => {
      addNotification({
        title: "Sync Complete",
        message: `${pendingItems.length} item(s) have been synced`,
        type: "success",
      })
    }, 5000)
  }

  // Update the FileSystemProvider value to include the updated handlers
  return (
    <FileSystemProvider
      value={{
        fileSystem,
        currentPath,
        selectedItems,
        viewMode,
        clipboard,
        syncPaused,
        canGoBack,
        canGoForward,
        setSelectedItems: handleSelectedItemsChange, // Use updated handler
        setViewMode,
        navigateTo,
        goBack,
        goForward,
        handleCreateFolder,
        handleDelete,
        handleRename,
        setPreviewFile,
        setDetailsItem,
        moveItems,
        cutItems,
        copyItems,
        pasteItems,
        updateSyncStatus,
        updatePermissions,
        toggleSyncPause,
        triggerManualSync,
        setSyncDialogOpen,
      }}
    >
      <div
        ref={fileManagerRef}
        className="flex h-screen overflow-hidden"
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = "copy"
          if (!isDraggingOver && e.dataTransfer.types.includes("Files")) {
            setIsDraggingOver(true)
          }
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          // Only set dragging to false if we're leaving the file manager
          if (e.currentTarget === fileManagerRef.current && !e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDraggingOver(false)
          }
        }}
        onDrop={(e) => {
          e.preventDefault()
          setIsDraggingOver(false)
          if (e.dataTransfer.files.length > 0) {
            handleExternalFileDrop(e.dataTransfer.files)
          }
        }}
      >
        {/* Mobile sidebar toggle */}
        <div className="md:hidden fixed top-2 left-2 z-50">
          <Button variant="outline" size="icon" className="bg-background" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        {/* Responsive sidebar */}
        <div
          className={cn(
            "fixed inset-0 z-40 md:relative md:z-0 transition-transform duration-300 ease-in-out",
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            "md:w-64 flex-shrink-0",
          )}
        >
          <Sidebar
            onNavigateToMarketplace={() => {
              setActiveView("marketplace")
              setSelectedMarketplaceApp(null)
              setSidebarOpen(false)
            }}
            onNavigateToFiles={() => {
              setActiveView("files")
              setSidebarOpen(false)
            }}
            activeView={activeView}
          />
        </div>

        <div className="flex flex-col flex-1 overflow-hidden">
          {activeView === "files" && (
            <>
              <Toolbar />
              <Breadcrumb />
              <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 overflow-auto p-4 relative">
                  <FileExplorer items={getCurrentItems()} />

                  <AnimatePresence>
                    {isDraggingOver && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10"
                      >
                        <div className="bg-card border-2 border-dashed border-primary rounded-lg p-8 text-center">
                          <div className="text-2xl font-bold mb-2">Drop files here</div>
                          <div className="text-muted-foreground">
                            Files will be added to {currentPath.length > 0 ? `/${currentPath.join("/")}` : "root"}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {/* Always show details sidebar - removed the conditional rendering */}
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 320, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="border-l border-border overflow-hidden"
                >
                  <FileDetails item={detailsItem || getCurrentDirectoryInfo()} onClose={() => {
                    // Don't close the sidebar, instead show directory info
                    setSelectedItems([]);
                    updateDetailsWithDirectory();
                  }} />
                </motion.div>
              </div>
            </>
          )}

          {activeView === "marketplace" && (
            <>
              {selectedMarketplaceApp ? (
                <MarketplaceAppDetail appId={selectedMarketplaceApp} onBack={() => setSelectedMarketplaceApp(null)} />
              ) : (
                <Marketplace onSelectApp={(appId) => setSelectedMarketplaceApp(appId)} />
              )}
            </>
          )}
        </div>

        {previewFile && <FilePreview file={previewFile} onClose={closePreview} />}

        <AnimatePresence>
          {uploads.length > 0 && (
            <UploadProgress uploads={uploads} onClear={(id) => setUploads((prev) => prev.filter((u) => u.id !== id))} />
          )}
        </AnimatePresence>

        {conflicts.length > 0 && (
          <FileConflictDialog
            conflicts={conflicts}
            onResolve={handleConflictResolution}
            onApplyToAll={handleApplyToAll}
            onCancel={() => setConflicts([])}
          />
        )}

        {syncDialogOpen && (
          <SyncStatusDialog
            fileSystem={fileSystem}
            syncPaused={syncPaused}
            onTogglePause={toggleSyncPause}
            onManualSync={triggerManualSync}
            onClose={() => setSyncDialogOpen(false)}
          />
        )}
      </div>
    </FileSystemProvider>
  )
}

