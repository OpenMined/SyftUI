"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileIcon } from "@/components/workspace/file-icon";
import { SyncStatus } from "@/components/workspace/sync-status";
import { PauseCircle, PlayCircle, AlertTriangle } from "lucide-react";
import type { FileSystemItem } from "@/lib/types";

interface SyncStatusDialogProps {
  open: boolean;
  onClose: () => void;
  isPaused: boolean;
  onPauseChange: (paused: boolean) => void;
}

export function SyncStatusDialog({
  open,
  onClose,
  isPaused,
  onPauseChange,
}: SyncStatusDialogProps) {
  const [syncingItems, setSyncingItems] = useState<FileSystemItem[]>([]);
  const [pendingItems, setPendingItems] = useState<FileSystemItem[]>([]);
  const [errorItems, setErrorItems] = useState<FileSystemItem[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Set some mock data for demo purposes
  useEffect(() => {
    if (open) {
      // Mock data for syncing items
      setSyncingItems([
        {
          id: "sync1",
          name: "document.pdf",
          type: "file",
          size: 1024,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          syncStatus: "syncing",
        },
        {
          id: "sync2",
          name: "images",
          type: "folder",
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          syncStatus: "syncing",
        },
      ]);

      // Mock data for pending items
      setPendingItems([
        {
          id: "pending1",
          name: "report.docx",
          type: "file",
          size: 2048,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          syncStatus: "pending",
        },
      ]);

      // Mock data for error items
      setErrorItems([
        {
          id: "error1",
          name: "corrupted.file",
          type: "file",
          size: 512,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          syncStatus: "error",
        },
      ]);

      // Set a mock last sync time
      if (!lastSyncTime) {
        setLastSyncTime(new Date(Date.now() - 1000 * 60 * 15)); // 15 minutes ago
      }
    }
  }, [open, lastSyncTime]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Function to handle prioritizing a pending item
  const handlePrioritizeItem = (itemId: string) => {
    // In a real app, this would move the item to the top of the sync queue
    // For this demo, we'll just show a console message
    console.log(`Prioritizing item ${itemId}`);

    // Find the item and update its status to syncing
    const item = pendingItems.find((item) => item.id === itemId);
    if (item) {
      // Move from pending to syncing
      setPendingItems(pendingItems.filter((i) => i.id !== itemId));
      setSyncingItems([item, ...syncingItems]);
    }
  };

  // Function to pause/resume syncing for a specific item
  const handleToggleItemSync = (itemId: string) => {
    // In a real app, this would pause/resume syncing for the specific item
    console.log(`Toggling sync for item ${itemId}`);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sync Status</DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Last synced</p>
              <p className="text-muted-foreground text-sm">
                {lastSyncTime ? formatTime(lastSyncTime) : "Never"}
              </p>
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
                  <div className="text-muted-foreground py-8 text-center">
                    No files currently syncing
                  </div>
                ) : (
                  <div className="space-y-2 py-2">
                    {syncingItems.map((item) => (
                      <div
                        key={item.id}
                        className="hover:bg-accent flex items-center rounded-md p-2"
                      >
                        <div className="mr-2 h-8 w-8">
                          <FileIcon
                            type={item.type}
                            extension={
                              item.type === "file"
                                ? item.name.split(".").pop()
                                : undefined
                            }
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {item.name}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Syncing...
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => handleToggleItemSync(item.id)}
                        >
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
                  <div className="text-muted-foreground py-8 text-center">
                    No pending files
                  </div>
                ) : (
                  <div className="space-y-2 py-2">
                    {pendingItems.map((item) => (
                      <div
                        key={item.id}
                        className="hover:bg-accent flex items-center rounded-md p-2"
                      >
                        <div className="mr-2 h-8 w-8">
                          <FileIcon
                            type={item.type}
                            extension={
                              item.type === "file"
                                ? item.name.split(".").pop()
                                : undefined
                            }
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {item.name}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Waiting to sync
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => handlePrioritizeItem(item.id)}
                        >
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
                  <div className="text-muted-foreground py-8 text-center">
                    No sync errors
                  </div>
                ) : (
                  <div className="space-y-2 py-2">
                    {errorItems.map((item) => (
                      <div
                        key={item.id}
                        className="hover:bg-accent flex items-center rounded-md p-2"
                      >
                        <div className="mr-2 h-8 w-8">
                          <FileIcon
                            type={item.type}
                            extension={
                              item.type === "file"
                                ? item.name.split(".").pop()
                                : undefined
                            }
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {item.name}
                          </p>
                          <p className="flex items-center text-xs text-red-500">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            {item.syncStatus === "error"
                              ? "Sync error"
                              : "Sync rejected"}
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
          <Button onClick={() => onPauseChange(!isPaused)}>
            {isPaused ? (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Resume Sync
              </>
            ) : (
              <>
                <PauseCircle className="mr-2 h-4 w-4" />
                Pause Sync
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
