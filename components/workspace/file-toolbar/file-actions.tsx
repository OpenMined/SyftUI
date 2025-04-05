"use client"

import { useState } from "react"
import { useFileSystemStore } from "@/stores/useFileSystemStore"
import { addToFavorites } from "@/lib/utils/favorites"
import {
  FolderPlus,
  Upload,
  Trash2,
  Scissors,
  Copy,
  Clipboard,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  ArrowUpDown,
  Star,
  FilePlus,
  TextCursorInput,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function FileActions() {
  const {
    clipboard,
    cutItems,
    copyItems,
    pasteItems,
    selectedItems,
    handleCreateFolder,
    handleCreateFile,
    handleDelete,
    handleRename,
    isRefreshing,
    refreshFileSystem,
    sortConfig,
    setSortConfig,
    fileSystem,
    currentPath,
    syncPaused,
    setSyncDialogOpen
  } = useFileSystemStore()

  // Check if any selected items are folders
  const hasSelectedFolder = selectedItems.length === 1 && fileSystem
    .filter(item => item.id === selectedItems[0])
    .some(item => item.type === 'folder')

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [isCreateFileOpen, setIsCreateFileOpen] = useState(false)
  const [newFileName, setNewFileName] = useState("")
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState("")
  const [sortMenuOpen, setSortMenuOpen] = useState(false)

  const handleCreateFolderSubmit = () => {
    if (newFolderName.trim()) {
      handleCreateFolder(newFolderName.trim())
      setNewFolderName("")
      setIsCreateFolderOpen(false)
    }
  }

  const handleCreateFileSubmit = () => {
    if (newFileName.trim()) {
      handleCreateFile(newFileName.trim())
      setNewFileName("")
      setIsCreateFileOpen(false)
    }
  }

  const handleRenameSubmit = () => {
    if (selectedItems.length === 1 && renameValue.trim()) {
      handleRename(selectedItems[0], renameValue.trim())
      setRenameValue("")
      setIsRenameOpen(false)
    }
  }

  const openRenameDialog = () => {
    if (selectedItems.length === 1) {
      // Find the selected item to get its current name
      const findItemById = (id: string, items: FileSystemItem[]): FileSystemItem | null => {
        for (const item of items) {
          if (item.id === id) return item
          if (item.type === "folder" && item.children) {
            const found = findItemById(id, item.children)
            if (found) return found
          }
        }
        return null
      }

      const selectedItem = findItemById(selectedItems[0], fileSystem)
      if (selectedItem) {
        setRenameValue(selectedItem.name)
        setIsRenameOpen(true)
      }
    }
  }

  // Function to handle favoriting the selected folder
  const handleAddToFavorites = () => {
    if (hasSelectedFolder) {
      const selectedFolderId = selectedItems[0];
      const folder = fileSystem.find(item => item.id === selectedFolderId);

      if (folder && folder.type === 'folder') {
        addToFavorites({
          id: folder.id,
          name: folder.name,
          type: folder.type,
          path: currentPath,
        });
      }
    }
  }

  // Sync status button
  const renderSyncStatusButton = () => {
    return (
      <Button variant="outline" size="sm" onClick={() => setSyncDialogOpen(true)} className="flex items-center gap-2">
        {syncPaused ? (
          <>
            <PauseCircle className="h-4 w-4 text-yellow-500" />
            <span className="text-yellow-500 hidden sm:inline">Sync Paused</span>
          </>
        ) : (
          <>
            <PlayCircle className="h-4 w-4 text-green-500" />
            <span className="text-green-500 hidden sm:inline">Sync Active</span>
          </>
        )}
      </Button>
    )
  }

  return (
    <>
      {/* Sync status button */}
      {renderSyncStatusButton()}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={refreshFileSystem} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Refresh</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Sort dropdown with tooltip */}
      <DropdownMenu open={sortMenuOpen} onOpenChange={setSortMenuOpen}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent className="select-none">
              <p>Sort by</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuRadioGroup
            value={sortConfig?.sortBy || "name"}
            onValueChange={(value) =>
              setSortConfig?.({ ...(sortConfig || { direction: "asc" }), sortBy: value as "name" | "date" | "size" | "type" })
            }
          >
            <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="date">Date Modified</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="size">Size</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="type">Type</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={sortConfig?.direction || "asc"}
            onValueChange={(value) =>
              setSortConfig?.({ ...(sortConfig || { sortBy: "name" }), direction: value as "asc" | "desc" })
            }
          >
            <DropdownMenuRadioItem value="asc">Ascending</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="desc">Descending</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setIsCreateFolderOpen(true)}>
              <FolderPlus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>New Folder</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setIsCreateFileOpen(true)}>
              <FilePlus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>New File</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <Upload className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Upload</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Favorite button - only visible when a folder is selected */}
      {hasSelectedFolder && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleAddToFavorites}>
                <Star className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add to Favorites</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <TooltipProvider>
        {selectedItems.length > 0 && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={openRenameDialog}>
                  <TextCursorInput className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Rename</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDelete(selectedItems)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => cutItems(selectedItems)}>
                  <Scissors className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cut (Ctrl+X)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => copyItems(selectedItems)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy (Ctrl+C)</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}

        {clipboard && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={pasteItems}>
                <Clipboard className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Paste (Ctrl+V)</p>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>

      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
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
              if (e.key === "Enter") handleCreateFolderSubmit()
            }}
          />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolderSubmit}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateFileOpen} onOpenChange={setIsCreateFileOpen}>
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
              if (e.key === "Enter") handleCreateFileSubmit()
            }}
          />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsCreateFileOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFileSubmit}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Item</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Enter new name"
            className="mt-4"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameSubmit()
            }}
          />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameSubmit}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
