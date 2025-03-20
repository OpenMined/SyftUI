"use client"

import { useState } from "react"
import { useFileSystem } from "@/components/contexts/file-system-context"
import { useClipboard } from "@/components/contexts/clipboard-context"
import { useSync } from "@/components/contexts/sync-context"
import {
  FolderPlus,
  Upload,
  Trash2,
  Scissors,
  Copy,
  Clipboard,
  PauseCircle,
  PlayCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function FileActions() {
  // Get context hooks
  const { selectedItems, handleCreateFolder, handleDelete } = useFileSystem()
  const { syncPaused, setSyncDialogOpen } = useSync()
  const { clipboard, cutItems, copyItems, pasteItems } = useClipboard()

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")

  const handleCreateFolderSubmit = () => {
    if (newFolderName.trim()) {
      handleCreateFolder(newFolderName.trim())
      setNewFolderName("")
      setIsCreateFolderOpen(false)
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
    </>
  )
}
