"use client"

import type React from "react"

import { useState } from "react"
import { useFileSystem } from "@/components/contexts/file-system-context"
import type { FileSystemItem } from "@/lib/types"
import { FileIcon } from "@/components/file-icon"
import { SyncStatus } from "@/components/sync-status"
import { ShareDialog } from "@/components/share-dialog"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuShortcut,
} from "@/components/ui/context-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useIsMobile } from "@/hooks/use-mobile"

interface FileExplorerProps {
  items: FileSystemItem[]
  selectedItems?: string[]
  onSelectedItemsChange?: (items: string[]) => void
  onNavigate?: (path: string[]) => void
  setPreviewFile?: (file: FileSystemItem | null) => void
  currentPath?: string[]
  viewMode?: "grid" | "list"
}

export function FileExplorer({ 
  items, 
  selectedItems: externalSelectedItems, 
  onSelectedItemsChange,
  onNavigate,
  setPreviewFile: externalSetPreviewFile,
  currentPath: externalCurrentPath,
  viewMode: externalViewMode
}: FileExplorerProps) {
  const fileSystemContext = useFileSystem()
  
  // Use either provided props or context values
  const viewMode = externalViewMode || fileSystemContext.viewMode
  const currentPath = externalCurrentPath || fileSystemContext.currentPath
  const selectedItems = externalSelectedItems || fileSystemContext.selectedItems
  const setSelectedItems = onSelectedItemsChange || fileSystemContext.setSelectedItems
  const navigateTo = onNavigate || fileSystemContext.navigateTo
  const setPreviewFile = externalSetPreviewFile || fileSystemContext.setPreviewFile
  const sortConfig = fileSystemContext.sortConfig || { sortBy: "name", direction: "asc" }
  
  // Always use these from context
  const {
    handleDelete,
    handleRename,
    setDetailsItem,
    moveItems,
    cutItems,
    copyItems,
    pasteItems,
    clipboard,
  } = fileSystemContext

  const [renameItem, setRenameItem] = useState<FileSystemItem | null>(null)
  const [newName, setNewName] = useState("")
  const [draggedItem, setDraggedItem] = useState<FileSystemItem | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [shareItem, setShareItem] = useState<FileSystemItem | null>(null)

  const isMobile = useIsMobile()

  const handleItemClick = (item: FileSystemItem, event: React.MouseEvent) => {
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
  }

  const handleItemDoubleClick = (item: FileSystemItem) => {
    if (item.type === "folder") {
      navigateTo([...currentPath, item.name])
    } else {
      setPreviewFile(item)
    }
  }

  const openRenameDialog = (item: FileSystemItem) => {
    setRenameItem(item)
    setNewName(item.name)
  }

  const handleRenameSubmit = () => {
    if (renameItem && newName.trim() && newName !== renameItem.name) {
      handleRename(renameItem.id, newName.trim())
    }
    setRenameItem(null)
  }

  const handleDragStart = (e: React.DragEvent, item: FileSystemItem) => {
    setDraggedItem(item)

    // Add path information to the dragged item for sidebar favorites
    const itemWithPath = {
      ...item,
      path: currentPath,
    }

    e.dataTransfer.setData("application/json", JSON.stringify(itemWithPath))
    e.dataTransfer.effectAllowed = "copyMove"
  }

  const handleDragOver = (e: React.DragEvent, targetId?: string) => {
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
  }

  const handleDragLeave = () => {
    setDropTarget(null)
  }

  const handleDrop = (e: React.DragEvent, targetId?: string) => {
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
  }

  const openShareDialog = (item: FileSystemItem) => {
    setShareItem(item)
  }

  // Handle click on empty space to deselect items
  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on the background (not on an item)
    if (e.currentTarget === e.target) {
      setSelectedItems([])
      setDetailsItem(null)
    }
  }

  // Apply sorting to items based on sort configuration
  const sortedItems = [...items].sort((a, b) => {
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
  });

  if (items.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center h-64 text-muted-foreground w-full"
        onDragOver={(e) => handleDragOver(e)}
        onDrop={(e) => handleDrop(e)}
        onClick={handleBackgroundClick}
      >
        <p>This folder is empty</p>
        <p className="text-sm mt-2">Drag files here to upload</p>
      </div>
    )
  }

  return (
    <>
      <div
        className="w-full h-full"
        onClick={handleBackgroundClick}
        onDragOver={(e) => handleDragOver(e)}
        onDrop={(e) => handleDrop(e)}
      >
        <div
          className={cn(
            "grid gap-4 min-h-[300px]",
            viewMode === "grid" ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" : "grid-cols-1",
          )}
          onClick={handleBackgroundClick}
        >
        <AnimatePresence>
          {sortedItems.map((item) => (
            <ContextMenu key={item.id}>
              <ContextMenuTrigger>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  layout
                  className={cn(
                    "group cursor-pointer rounded-lg p-2 transition-colors relative",
                    selectedItems.includes(item.id) ? "bg-accent" : "hover:bg-muted",
                    dropTarget === item.id && "ring-2 ring-primary",
                    viewMode === "list" && "flex items-center gap-3",
                  )}
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
                  <div className="flex w-full justify-center">
                    <div className={cn("flex flex-col items-center gap-2", viewMode === "list" && "flex-row grow")}>
                      <div className={cn("relative", viewMode === "grid" ? "h-16 w-16" : "h-10 w-10")}>
                        <FileIcon
                          type={item.type}
                          extension={item.type === "file" ? item.name.split(".").pop() : undefined}
                        />
                        {item.syncStatus && (
                          <div className="absolute -bottom-1 -right-1">
                            <SyncStatus status={item.syncStatus} />
                          </div>
                        )}
                      </div>
                      <div className={cn("w-full text-center truncate", viewMode === "list" && "text-left flex-1")}>
                        <p className="truncate text-sm">{item.name}</p>
                        {viewMode === "list" && (
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {new Date(item.modifiedAt).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    {viewMode === "list" && item.syncStatus && (
                      <SyncStatus status={item.syncStatus} variant="badge" className="py-1 my-auto" />
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
                {clipboard && (
                  <ContextMenuItem onClick={pasteItems}>
                    Paste
                    <ContextMenuShortcut>⌘V</ContextMenuShortcut>
                  </ContextMenuItem>
                )}
                {isMobile && (
                  <ContextMenuItem onClick={() => setDetailsItem(item)}>
                    Details
                  </ContextMenuItem>
                )}
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => openRenameDialog(item)}>Rename</ContextMenuItem>
                <ContextMenuItem onClick={() => openShareDialog(item)}>Share & Permissions</ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                  onClick={() => handleDelete([item.id])}
                  className="text-destructive focus:text-destructive"
                >
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </AnimatePresence>
        </div>
      </div>

      <Dialog open={!!renameItem} onOpenChange={(open) => !open && setRenameItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Item</DialogTitle>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="mt-4"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameSubmit()
            }}
          />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setRenameItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleRenameSubmit}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {shareItem && <ShareDialog item={shareItem} onClose={() => setShareItem(null)} />}
    </>
  )
}

