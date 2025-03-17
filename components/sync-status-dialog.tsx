"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileIcon } from "@/components/file-icon"
import { SyncStatus } from "@/components/sync-status"
import { PauseCircle, PlayCircle, AlertTriangle } from "lucide-react"
import type { FileSystemItem } from "@/lib/types"

interface SyncStatusDialogProps {
  fileSystem: FileSystemItem[]
  syncPaused: boolean
  onTogglePause: () => void
  onManualSync: () => void
  onClose: () => void
}

export function SyncStatusDialog({
  fileSystem,
  syncPaused,
  onTogglePause,
  onManualSync,
  onClose,
}: SyncStatusDialogProps) {
  const [syncingItems, setSyncingItems] = useState<FileSystemItem[]>([])
  const [pendingItems, setPendingItems] = useState<FileSystemItem[]>([])
  const [errorItems, setErrorItems] = useState<FileSystemItem[]>([])
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  // Find all items with sync status
  useEffect(() => {
    const syncing: FileSystemItem[] = []
    const pending: FileSystemItem[] = []
    const errors: FileSystemItem[] = []

    const findItems = (items: FileSystemItem[]) => {
      items.forEach((item) => {
        if (item.syncStatus === "syncing") {
          syncing.push(item)
        } else if (item.syncStatus === "pending") {
          pending.push(item)
        } else if (item.syncStatus === "error" || item.syncStatus === "rejected") {
          errors.push(item)
        }

        if (item.type === "folder" && item.children) {
          findItems(item.children)
        }
      })
    }

    findItems(fileSystem)

    setSyncingItems(syncing)
    setPendingItems(pending)
    setErrorItems(errors)

    // Set a mock last sync time
    if (!lastSyncTime) {
      setLastSyncTime(new Date(Date.now() - 1000 * 60 * 15)) // 15 minutes ago
    }
  }, [fileSystem, lastSyncTime])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Function to handle prioritizing a pending item
  const handlePrioritizeItem = (itemId: string) => {
    // In a real app, this would move the item to the top of the sync queue
    // For this demo, we'll just show a console message
    console.log(`Prioritizing item ${itemId}`)

    // Find the item and update its status to syncing
    const item = pendingItems.find((item) => item.id === itemId)
    if (item) {
      // Move from pending to syncing
      setPendingItems(pendingItems.filter((i) => i.id !== itemId))
      setSyncingItems([item, ...syncingItems])
    }
  }

  // Function to pause/resume syncing for a specific item
  const handleToggleItemSync = (itemId: string) => {
    // In a real app, this would pause/resume syncing for the specific item
    console.log(`Toggling sync for item ${itemId}`)
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sync Status</DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium">Last synced</p>
              <p className="text-sm text-muted-foreground">{lastSyncTime ? formatTime(lastSyncTime) : "Never"}</p>
            </div>
          </div>

          <Tabs defaultValue="syncing">
            <TabsList className="w-full">
              <TabsTrigger value="syncing" className="flex-1">
                Syncing ({syncingItems.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex-1">
                Pending ({pendingItems.length})
              </TabsTrigger>
              <TabsTrigger value="errors" className="flex-1">
                Errors ({errorItems.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="syncing">
              <ScrollArea className="h-60">
                {syncingItems.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">No files currently syncing</div>
                ) : (
                  <div className="space-y-2 py-2">
                    {syncingItems.map((item) => (
                      <div key={item.id} className="flex items-center p-2 rounded-md hover:bg-accent">
                        <div className="h-8 w-8 mr-2">
                          <FileIcon
                            type={item.type}
                            extension={item.type === "file" ? item.name.split(".").pop() : undefined}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Syncing...</p>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8" onClick={() => handleToggleItemSync(item.id)}>
                          <PauseCircle className="h-4 w-4" />
                        </Button>
                        <SyncStatus status="syncing" />
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="pending">
              <ScrollArea className="h-60">
                {pendingItems.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">No pending files</div>
                ) : (
                  <div className="space-y-2 py-2">
                    {pendingItems.map((item) => (
                      <div key={item.id} className="flex items-center p-2 rounded-md hover:bg-accent">
                        <div className="h-8 w-8 mr-2">
                          <FileIcon
                            type={item.type}
                            extension={item.type === "file" ? item.name.split(".").pop() : undefined}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Waiting to sync</p>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8" onClick={() => handlePrioritizeItem(item.id)}>
                          Sync Now
                        </Button>
                        <SyncStatus status="pending" />
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="errors">
              <ScrollArea className="h-60">
                {errorItems.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">No sync errors</div>
                ) : (
                  <div className="space-y-2 py-2">
                    {errorItems.map((item) => (
                      <div key={item.id} className="flex items-center p-2 rounded-md hover:bg-accent">
                        <div className="h-8 w-8 mr-2">
                          <FileIcon
                            type={item.type}
                            extension={item.type === "file" ? item.name.split(".").pop() : undefined}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-red-500 flex items-center">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {item.syncStatus === "error" ? "Sync error" : "Sync rejected"}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8">
                          Retry
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onTogglePause}>
            {syncPaused ? (
              <>
                <PlayCircle className="h-4 w-4 mr-2" />
                Resume Sync
              </>
            ) : (
              <>
                <PauseCircle className="h-4 w-4 mr-2" />
                Pause Sync
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

