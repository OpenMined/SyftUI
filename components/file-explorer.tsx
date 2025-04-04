"use client"

import React, { useState, useCallback, useMemo } from "react"
import { useFileSystemStore } from "@/stores/useFileSystemStore"
import type { FileSystemItem, ClipboardItem } from "@/lib/types"
import { FileIcon } from "@/components/file-icon"
import { SyncStatus } from "@/components/sync-status"
import { addToFavorites } from "@/lib/utils/favorites"
import { PermissionsDialog } from "@/components/permissions-dialog"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
} from "@/components/ui/context-menu"
import { Star } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useIsMobile } from "@/hooks/use-mobile"
import { updateUrlWithPath } from "@/lib/utils/url"

// Background context menu component
interface BackgroundContextMenuContentProps {
  currentPath: string[]
  sortConfig: { sortBy: "name" | "date" | "size" | "type", direction: "asc" | "desc" }
  setSortConfig: (config: { sortBy: "name" | "date" | "size" | "type", direction: "asc" | "desc" }) => void
  setViewMode?: (mode: "grid" | "list") => void
  getCurrentDirectoryInfo: () => FileSystemItem | null
  handleCreateFolder?: (name: string) => void
  handleCreateFile?: (name: string) => void
  isRefreshing: bool
  refreshFileSystem: () => void
  toggleSyncPause?: () => void
  syncPaused?: boolean
  clipboard?: ClipboardItem | null
  pasteItems?: () => void
}

function BackgroundContextMenuContent({
  currentPath,
  sortConfig,
  setSortConfig,
  setViewMode,
  viewMode,
  getCurrentDirectoryInfo,
  handleCreateFolder,
  handleCreateFile,
  isRefreshing,
  refreshFileSystem,
  toggleSyncPause,
  syncPaused,
  clipboard,
  pasteItems
}: BackgroundContextMenuContentProps) {
  // Get current directory name
  const currentDirName = currentPath.length > 0 ? currentPath[currentPath.length - 1] : "Workspace root"

  // State for the permissions dialog
  const [permissionsDialogItem, setPermissionsDialogItem] = useState<FileSystemItem | null>(null)
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [showNewFileDialog, setShowNewFileDialog] = useState(false)
  const [newFileName, setNewFileName] = useState("")

  const handleCreateNewFolder = () => {
    setShowNewFolderDialog(true);
  }

  const handleCreateNewFile = () => {
    setShowNewFileDialog(true);
  }

  const submitNewFolder = () => {
    if (handleCreateFolder && newFolderName.trim()) {
      handleCreateFolder(newFolderName.trim());
      setNewFolderName("");
    }
    setShowNewFolderDialog(false);
  }

  const submitNewFile = () => {
    if (handleCreateFile && newFileName.trim()) {
      handleCreateFile(newFileName.trim());
      setNewFileName("");
    }
    setShowNewFileDialog(false);
  }

  // Handler for adding current directory to favorites
  const handleAddToFavorites = () => {
    // For root directory
    if (currentPath.length === 0) {
      addToFavorites({
        id: "root", // Using "root" as ID for root directory
        name: "Workspace",
        type: "folder",
        path: []
      });
      return;
    }

    // For non-root directories, we need to construct an item
    const dirName = currentPath[currentPath.length - 1];
    const dirPath = currentPath.slice(0, -1);

    addToFavorites({
      id: `dir-${dirName}`, // Creating a pseudo-ID based on name
      name: dirName,
      type: "folder",
      path: dirPath
    });
  }

  return (
    <>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => { }} className="text-muted-foreground">
          {currentDirName}
        </ContextMenuItem>
        <ContextMenuSeparator />

        {/* New menu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>New</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={handleCreateNewFolder}>Folder</ContextMenuItem>
            <ContextMenuItem onClick={handleCreateNewFile}>File</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuItem>Upload File</ContextMenuItem>
        <ContextMenuItem>Download as ZIP</ContextMenuItem>
        <ContextMenuItem onClick={pasteItems} disabled={!clipboard} className={!clipboard ? "text-muted-foreground pointer-events-none opacity-50" : ""}>
          Paste
          <ContextMenuShortcut>⌘V</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />

        <ContextMenuItem>Activity</ContextMenuItem>
        <ContextMenuItem onClick={() => {
          const dirInfo = getCurrentDirectoryInfo();
          if (dirInfo) setPermissionsDialogItem(dirInfo);
        }}>Permissions</ContextMenuItem>
        <ContextMenuItem onClick={refreshFileSystem} disabled={isRefreshing}>{isRefreshing ? "Refreshing..." : "Refresh"}</ContextMenuItem>
        <ContextMenuItem onClick={toggleSyncPause}>
          {syncPaused ? "Resume Sync" : "Pause Sync"}
        </ContextMenuItem>
        <ContextMenuItem onClick={handleAddToFavorites}>
          <Star className="mr-2 h-4 w-4" />
          Add Current Folder to Favorites
        </ContextMenuItem>
        <ContextMenuSeparator />

        {/* View mode submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>View</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuRadioGroup
              value={viewMode}
              onValueChange={(value) => setViewMode && setViewMode(value as "grid" | "list")}
            >
              <ContextMenuRadioItem value="grid">Grid</ContextMenuRadioItem>
              <ContextMenuRadioItem value="list">List</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* Sort by submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>Sort by</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuRadioGroup
              value={sortConfig.sortBy}
              onValueChange={(value) =>
                setSortConfig({ ...sortConfig, sortBy: value as "name" | "date" | "size" | "type" })
              }
            >
              <ContextMenuRadioItem value="name">Name</ContextMenuRadioItem>
              <ContextMenuRadioItem value="date">Date Modified</ContextMenuRadioItem>
              <ContextMenuRadioItem value="size">Size</ContextMenuRadioItem>
              <ContextMenuRadioItem value="type">Type</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
            <ContextMenuSeparator />
            <ContextMenuRadioGroup
              value={sortConfig.direction}
              onValueChange={(value) =>
                setSortConfig({ ...sortConfig, direction: value as "asc" | "desc" })
              }
            >
              <ContextMenuRadioItem value="asc">Ascending</ContextMenuRadioItem>
              <ContextMenuRadioItem value="desc">Descending</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>

      {/* New folder dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            className="mt-4"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") submitNewFolder()
            }}
          />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>Cancel</Button>
            <Button onClick={submitNewFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New file dialog */}
      <Dialog open={showNewFileDialog} onOpenChange={setShowNewFileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New File</DialogTitle>
          </DialogHeader>
          <Input
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="File name"
            className="mt-4"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") submitNewFile()
            }}
          />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowNewFileDialog(false)}>Cancel</Button>
            <Button onClick={submitNewFile}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions dialog */}
      {permissionsDialogItem && <PermissionsDialog item={permissionsDialogItem} onClose={() => setPermissionsDialogItem(null)} />}
    </>
  )
}

interface FileExplorerProps {
  items: FileSystemItem[]
  selectedItems?: string[]
  onSelectedItemsChange?: (items: string[]) => void
  onNavigate?: (path: string[]) => void
  setPreviewFile?: (file: FileSystemItem | null) => void
  currentPath?: string[]
  viewMode?: "grid" | "list"
  getCurrentDirectoryInfo?: () => FileSystemItem | null
}

// Interface for FileExplorerItem props
interface FileExplorerItemProps {
  item: FileSystemItem
  viewMode: "grid" | "list"
  selectedItems: string[]
  currentPath: string[]
  handleItemClick: (item: FileSystemItem, event: React.MouseEvent) => void
  handleItemDoubleClick: (item: FileSystemItem) => void
  handleDragStart: (e: React.DragEvent, item: FileSystemItem) => void
  handleDragOver: (e: React.DragEvent, targetId?: string) => void
  handleDragLeave: () => void
  handleDrop: (e: React.DragEvent, targetId?: string) => void
  dropTarget: string | null
  cutItems: (ids: string[]) => void
  copyItems: (ids: string[]) => void
  pasteItems: () => void
  clipboard: any
  setDetailsItem: (item: FileSystemItem | null) => void
  openRenameDialog: (item: FileSystemItem) => void
  openShareDialog: (item: FileSystemItem) => void
  handleDelete: (ids: string[]) => void
  isMobile: boolean
}

// Extracted file explorer item component for better organization
const FileExplorerItem = React.memo(function FileExplorerItem({
  item,
  viewMode,
  selectedItems,
  currentPath,
  handleItemClick,
  handleItemDoubleClick,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  dropTarget,
  cutItems,
  copyItems,
  pasteItems,
  clipboard,
  setDetailsItem,
  openRenameDialog,
  openShareDialog,
  handleDelete,
  isMobile
}: FileExplorerItemProps) {
  // Extract common class names for better readability
  const itemClasses = cn(
    `group cursor-pointer rounded-lg ${ITEM_PADDING} transition-colors relative flex items-center justify-center`,
    viewMode === "grid" ? `${GRID_ITEM_SIZE} shrink-0 grow-0` : "w-full",
    selectedItems.includes(item.id) ? "bg-accent" : "hover:bg-muted",
    dropTarget === item.id && "ring-2 ring-primary",
    viewMode === "list" && "justify-start gap-3"
  )

  const contentClasses = cn(
    "flex",
    viewMode === "grid" ? "flex-col items-center gap-2 w-full overflow-hidden" : "flex-row items-center w-full"
  )

  const iconClasses = cn(
    "relative",
    viewMode === "grid" ? GRID_ICON_SIZE : `${LIST_ICON_SIZE} shrink-0`
  )

  const textClasses = cn(
    "truncate",
    viewMode === "grid" ? "w-full text-center mt-2 px-1" : "flex-1 text-left ml-2"
  )

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          layout
          className={itemClasses}
          onClick={(e) => {
            e.stopPropagation() // Prevent event from bubbling to background
            handleItemClick(item, e)
          }}
          onDoubleClick={() => handleItemDoubleClick(item)}
          draggable
          onDragStart={(e) => handleDragStart(e, item)}
          onDragOver={(e) => handleDragOver(e, item.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, item.id)}
        >
          <div className={contentClasses}>
            <div className={iconClasses}>
              <FileIcon
                type={item.type}
                extension={item.type === "file" ? item.name.split(".").pop() : undefined}
              />
              {item.syncStatus && item.syncStatus !== "hidden" && (
                <div className="absolute -bottom-1 -right-1">
                  <SyncStatus status={item.syncStatus} />
                </div>
              )}
            </div>
            <div className={textClasses}>
              <p className="truncate text-sm">{item.name}</p>
              {viewMode === "list" && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.modifiedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
            {viewMode === "list" && item.syncStatus && item.syncStatus !== "hidden" && (
              <SyncStatus status={item.syncStatus} variant="badge" className="py-1 mr-2 shrink-0" />
            )}
          </div>
        </motion.div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => handleItemDoubleClick(item)}>
          {item.type === "folder" ? "Open" : "Preview"}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => cutItems([item.id])}>
          Cut
          <ContextMenuShortcut>⌘X</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => copyItems([item.id])}>
          Copy
          <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={pasteItems} disabled={!clipboard} className={!clipboard ? "text-muted-foreground pointer-events-none opacity-50" : ""}>
          Paste
          <ContextMenuShortcut>⌘V</ContextMenuShortcut>
        </ContextMenuItem>
        {isMobile && (
          <ContextMenuItem onClick={() => setDetailsItem(item)}>
            Details
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => openRenameDialog(item)}>Rename</ContextMenuItem>
        <ContextMenuItem onClick={() => openShareDialog(item)}>Permissions</ContextMenuItem>
        {item.type === 'folder' && (
          <ContextMenuItem
            onClick={() => addToFavorites({
              id: item.id,
              name: item.name,
              type: item.type,
              path: currentPath
            })}
          >
            <Star className="mr-2 h-4 w-4" />
            Add to Favorites
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => handleDelete([item.id])}
          className="text-destructive focus:text-destructive"
        >
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
})

// Common style variables to improve consistency
const GRID_ITEM_SIZE = "md:w-32 md:h-32"
const GRID_ICON_SIZE = "h-16 w-16"
const LIST_ICON_SIZE = "h-10 w-10"
const ITEM_PADDING = "p-2"
const GRID_GAP = "gap-4"
const LIST_GAP = "gap-2"

// RenameDialog component for better organization
const RenameDialog = React.memo(({ open, onOpenChange, name, setName, onSubmit }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  name: string
  setName: (name: string) => void
  onSubmit: () => void
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Item</DialogTitle>
        </DialogHeader>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-4"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit()
          }}
        />
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>Rename</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})

export function FileExplorer({
  items,
  selectedItems: externalSelectedItems,
  onSelectedItemsChange,
  onNavigate,
  setPreviewFile: externalSetPreviewFile,
  currentPath: externalCurrentPath,
  viewMode: externalViewMode,
  getCurrentDirectoryInfo
}: FileExplorerProps) {
  const {
    viewMode: fsViewMode,
    currentPath: fsCurrentPath,
    selectedItems: fsSelectedItems,
    setSelectedItems: fsSetSelectedItems,
    navigateTo: fsNavigateTo,
    setPreviewFile: fsSetPreviewFile,
    sortConfig,
    handleDelete,
    handleRename,
    setDetailsItem,
    moveItems,
    cutItems,
    copyItems,
    pasteItems,
    clipboard,
    handleCreateFolder,
    handleCreateFile,
    isRefreshing,
    refreshFileSystem,
    toggleSyncPause,
    syncPaused,
    setSortConfig,
    setViewMode: fsSetViewMode
  } = useFileSystemStore()

  // Use either provided props or context values
  const viewMode = externalViewMode || fsViewMode
  const currentPath = externalCurrentPath || fsCurrentPath
  const selectedItems = externalSelectedItems || fsSelectedItems
  const setSelectedItems = onSelectedItemsChange || fsSetSelectedItems
  const navigateTo = onNavigate || fsNavigateTo
  const setPreviewFile = externalSetPreviewFile || fsSetPreviewFile

  // Empty unused block since we're already destructuring these values above

  // Group all state variables together for better readability
  const [renameItem, setRenameItem] = useState<FileSystemItem | null>(null)
  const [newName, setNewName] = useState("")
  const [draggedItem, setDraggedItem] = useState<FileSystemItem | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [shareItem, setShareItem] = useState<FileSystemItem | null>(null)

  const isMobile = useIsMobile()

  const handleItemDoubleClick = useCallback((item: FileSystemItem) => {
    if (item.type === "folder") {
      // Navigate to folder and update URL
      navigateTo([...currentPath, item.name])
    } else {
      // Open file preview
      setPreviewFile(item)

      // Add file parameter to URL
      updateUrlWithPath([...currentPath, item.name]);
    }
  }, [navigateTo, currentPath, setPreviewFile])

  const handleItemClick = useCallback((item: FileSystemItem, event: React.MouseEvent) => {
    // Single click now selects the item and shows details
    if (event.ctrlKey || event.metaKey) {
      // Multi-select with Ctrl/Cmd
      setSelectedItems(
        selectedItems.includes(item.id) ? selectedItems.filter((id) => id !== item.id) : [...selectedItems, item.id],
      )
    } else if (event.shiftKey && selectedItems.length > 0) {
      // Range select with Shift
      const itemIds = items.map((i) => i.id)
      const firstSelectedIndex = itemIds.indexOf(selectedItems[0])
      const clickedIndex = itemIds.indexOf(item.id)
      const start = Math.min(firstSelectedIndex, clickedIndex)
      const end = Math.max(firstSelectedIndex, clickedIndex)
      const rangeIds = itemIds.slice(start, end + 1)
      setSelectedItems(rangeIds)
    } else {
      // Single select - show details panel
      setSelectedItems([item.id])
      isMobile ? handleItemDoubleClick(item) : setDetailsItem(item)
    }
  }, [setSelectedItems, selectedItems, isMobile, handleItemDoubleClick, setDetailsItem, items])

  const openRenameDialog = useCallback((item: FileSystemItem) => {
    setRenameItem(item)
    setNewName(item.name)
  }, [])

  const handleRenameSubmit = useCallback(() => {
    if (renameItem && newName.trim() && newName !== renameItem.name) {
      handleRename(renameItem.id, newName.trim())
    }
    setRenameItem(null)
  }, [renameItem, newName, handleRename, setRenameItem])

  const handleDragStart = useCallback((e: React.DragEvent, item: FileSystemItem) => {
    setDraggedItem(item)

    // Add path information to the dragged item for sidebar favorites
    const itemWithPath = {
      ...item,
      path: currentPath,
    }

    e.dataTransfer.setData("application/json", JSON.stringify(itemWithPath))
    e.dataTransfer.effectAllowed = "copyMove"
  }, [setDraggedItem, currentPath])

  const handleDragOver = useCallback((e: React.DragEvent, targetId?: string) => {
    e.preventDefault()

    // Only allow dropping on folders
    if (targetId) {
      const target = items.find((item) => item.id === targetId)
      if (target?.type === "folder" && draggedItem && target.id !== draggedItem.id) {
        e.dataTransfer.dropEffect = "move"
        setDropTarget(targetId)
      } else {
        e.dataTransfer.dropEffect = "none"
      }
    } else {
      // Allow dropping in empty space (to move to current folder)
      e.dataTransfer.dropEffect = "move"
      setDropTarget(null)
    }
  }, [items, draggedItem, setDropTarget])

  const handleDragLeave = useCallback(() => {
    setDropTarget(null)
  }, [setDropTarget])

  const handleDrop = useCallback((e: React.DragEvent, targetId?: string) => {
    e.preventDefault()
    setDropTarget(null)

    // Handle files dropped from OS
    if (e.dataTransfer.files.length > 0) {
      // This is handled at the FileManager level
      return
    }

    // Handle internal drag and drop
    const data = e.dataTransfer.getData("application/json")
    if (!data) return

    try {
      const draggedItem = JSON.parse(data)

      if (targetId) {
        // Drop on a folder
        const target = items.find((item) => item.id === targetId)
        if (target?.type === "folder" && target.id !== draggedItem.id) {
          const targetPath = [...currentPath, target.name]
          moveItems([draggedItem.id], targetPath)
        }
      } else {
        // Drop in the current folder (no-op if already in this folder)
        // Check if this is from another path
        if (draggedItem.path && JSON.stringify(draggedItem.path) !== JSON.stringify(currentPath)) {
          moveItems([draggedItem.id], currentPath)
        }
      }
    } catch (err) {
      console.error("Failed to parse drag data", err)
    }

    setDraggedItem(null)
  }, [setDropTarget, items, currentPath, moveItems, setDraggedItem])

  const openShareDialog = useCallback((item: FileSystemItem) => {
    setShareItem(item)
  }, [setShareItem])

  // Handle click on empty space to deselect items
  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    // Only deselect if clicking directly on the background (not on an item)
    if (e.currentTarget === e.target) {
      setSelectedItems([])
      setDetailsItem(null)
    }
  }, [setSelectedItems, setDetailsItem])

  // Handle right-click on empty space
  const handleBackgroundContextMenu = useCallback((e: React.MouseEvent) => {
    // Only show context menu if clicking directly on the background (not on an item)
    if (e.currentTarget === e.target) {
      // The context menu will be shown automatically by the ContextMenu component
      // We just need to make sure we don't prevent the default context menu from showing
    }
  }, [])

  // Apply sorting to items based on sort configuration - memoized to prevent unnecessary re-sorting
  const sortedItems = useMemo(() => [...items].sort((a, b) => {
    // Always show folders before files regardless of sort option
    if (a.type === "folder" && b.type === "file") return -1;
    if (a.type === "file" && b.type === "folder") return 1;

    // If both are the same type (folder or file), then sort by the selected criteria
    let compareResult = 0;

    switch (sortConfig.sortBy) {
      case "name":
        compareResult = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        break;
      case "date":
        compareResult = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
        break;
      case "size":
        compareResult = (a.size || 0) - (b.size || 0);
        break;
      case "type":
        // For files, compare by extension
        if (a.type === "file" && b.type === "file") {
          const aExt = a.name.split('.').pop() || '';
          const bExt = b.name.split('.').pop() || '';
          compareResult = aExt.localeCompare(bExt);
          // If same extension, sort by name
          if (compareResult === 0) {
            compareResult = a.name.localeCompare(b.name);
          }
        } else {
          // For folders, sort by name
          compareResult = a.name.localeCompare(b.name);
        }
        break;
      default:
        compareResult = a.name.localeCompare(b.name);
    }

    // Apply sorting direction
    return sortConfig.direction === "asc" ? compareResult : -compareResult;
  }), [items, sortConfig]);

  // Extract empty state UI into a component for reuse
  const renderEmptyState = useCallback(() => (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className="flex flex-col items-center justify-center text-muted-foreground w-full h-full"
          onDragOver={(e) => handleDragOver(e)}
          onDrop={(e) => handleDrop(e)}
          onClick={handleBackgroundClick}
          onContextMenu={handleBackgroundContextMenu}
        >
          <p>This folder is empty</p>
          <p className="text-sm mt-2">Drag files here to upload</p>
        </div>
      </ContextMenuTrigger>
      <BackgroundContextMenuContent
        currentPath={currentPath}
        sortConfig={sortConfig}
        setSortConfig={setSortConfig}
        setViewMode={fsSetViewMode}
        viewMode={viewMode}
        getCurrentDirectoryInfo={() => {
          // Create a dummy implementation if none provided
          if (!getCurrentDirectoryInfo) {
            return currentPath.length > 0
              ? { id: `dir-${currentPath[currentPath.length - 1]}`, name: currentPath[currentPath.length - 1], type: 'folder' as const }
              : { id: 'root', name: 'Workspace', type: 'folder' as const };
          }
          return getCurrentDirectoryInfo();
        }}
        handleCreateFolder={handleCreateFolder}
        handleCreateFile={handleCreateFile}
        toggleSyncPause={toggleSyncPause}
        syncPaused={syncPaused}
        clipboard={clipboard}
        pasteItems={pasteItems}
      />
    </ContextMenu>
  ), [handleDragOver, handleDrop, handleBackgroundClick, handleBackgroundContextMenu, currentPath, sortConfig, viewMode, handleCreateFolder, handleCreateFile, toggleSyncPause, syncPaused, clipboard, pasteItems, getCurrentDirectoryInfo, setSortConfig, fsSetViewMode])

  if (items.length === 0) {
    return renderEmptyState()
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className="w-full h-full"
            onClick={handleBackgroundClick}
            onDragOver={(e) => handleDragOver(e)}
            onDrop={(e) => handleDrop(e)}
            onContextMenu={handleBackgroundContextMenu}
          >
            <div
              className={cn(
                "min-h-[300px] w-full",
                viewMode === "grid" ? `grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap md:p-2 ${GRID_GAP}` : `flex p-2 flex-col ${LIST_GAP}`
              )}
              onClick={handleBackgroundClick}
            >
              <AnimatePresence>
                {sortedItems.map((item) => (
                  <FileExplorerItem
                    key={item.id}
                    item={item}
                    viewMode={viewMode}
                    selectedItems={selectedItems}
                    currentPath={currentPath}
                    handleItemClick={handleItemClick}
                    handleItemDoubleClick={handleItemDoubleClick}
                    handleDragStart={handleDragStart}
                    handleDragOver={handleDragOver}
                    handleDragLeave={handleDragLeave}
                    handleDrop={handleDrop}
                    dropTarget={dropTarget}
                    cutItems={cutItems}
                    copyItems={copyItems}
                    pasteItems={pasteItems}
                    clipboard={clipboard}
                    setDetailsItem={setDetailsItem}
                    openRenameDialog={openRenameDialog}
                    openShareDialog={openShareDialog}
                    handleDelete={handleDelete}
                    isMobile={isMobile}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </ContextMenuTrigger>
        <BackgroundContextMenuContent
          currentPath={currentPath}
          sortConfig={sortConfig}
          setSortConfig={setSortConfig}
          setViewMode={fsSetViewMode}
          viewMode={viewMode}
          getCurrentDirectoryInfo={() => {
            // Create a dummy implementation if none provided
            if (!getCurrentDirectoryInfo) {
              return currentPath.length > 0
                ? { id: `dir-${currentPath[currentPath.length - 1]}`, name: currentPath[currentPath.length - 1], type: 'folder' as const }
                : { id: 'root', name: 'Workspace', type: 'folder' as const };
            }
            return getCurrentDirectoryInfo();
          }}
          handleCreateFolder={handleCreateFolder}
          handleCreateFile={handleCreateFile}
          isRefreshing={isRefreshing}
          refreshFileSystem={refreshFileSystem}
          toggleSyncPause={toggleSyncPause}
          syncPaused={syncPaused}
          clipboard={clipboard}
          pasteItems={pasteItems}
        />
      </ContextMenu>

      <RenameDialog
        open={!!renameItem}
        onOpenChange={(open) => !open && setRenameItem(null)}
        name={newName}
        setName={setNewName}
        onSubmit={handleRenameSubmit}
      />

      {shareItem && <PermissionsDialog item={shareItem} onClose={() => setShareItem(null)} />}
    </>
  )
}
