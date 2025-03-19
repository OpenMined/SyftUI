"use client"

import { useState } from "react"
import { useFileSystem } from "@/components/file-system-context"
import { useHistory } from "@/components/history-context"
import {
  FolderPlus,
  Upload,
  Trash2,
  Grid,
  List,
  Search,
  Scissors,
  Copy,
  Clipboard,
  Undo2,
  Redo2,
  ChevronLeft,
  ChevronRight,
  PauseCircle,
  PlayCircle,
  Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationBell } from "@/components/notification-bell"

export function Toolbar({ sidebarOpen, setSidebarOpen }) {
  const {
    viewMode,
    setViewMode,
    selectedItems,
    handleCreateFolder,
    handleDelete,
    cutItems,
    copyItems,
    pasteItems,
    clipboard,
    syncPaused,
    setSyncDialogOpen,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    toggleSyncPause,
  } = useFileSystem()

  const { canUndo, canRedo, undo, redo } = useHistory()

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")

  const handleCreateFolderSubmit = () => {
    if (newFolderName.trim()) {
      handleCreateFolder(newFolderName.trim())
      setNewFolderName("")
      setIsCreateFolderOpen(false)
    }
  }

  const handleUndo = () => {
    undo()
  }

  const handleRedo = () => {
    redo()
  }

  // Simplified sync status button
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
    <div className="flex flex-wrap items-center justify-between px-2 sm:px-4 py-2 border-b border-border gap-2">
      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
        {/* Mobile sidebar toggle - only visible on mobile */}
        <div className="md:hidden">
          <Button variant="outline" size="icon" className="bg-background" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        {/* Sync status button - first item */}
        {renderSyncStatusButton()}

        {/* Navigation buttons */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={goBack} disabled={!canGoBack}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Back</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={goForward} disabled={!canGoForward}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Forward</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

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
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Upload className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Upload</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          {selectedItems.length > 0 && (
            <>
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

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleUndo} disabled={!canUndo}>
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Undo (Ctrl+Z)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleRedo} disabled={!canRedo}>
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Redo (Ctrl+Y)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <div className="relative hidden sm:block">
          <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input type="search" placeholder="Search files..." className="w-40 md:w-64 pl-8" />
        </div>
        <div className="flex border rounded-md overflow-hidden">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            className="rounded-none"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            className="rounded-none"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        <NotificationBell />
        <ThemeToggle />

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
      </div>
    </div>
  )
}

