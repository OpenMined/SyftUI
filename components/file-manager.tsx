"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { FileExplorer } from "@/components/file-explorer"
import { Breadcrumb } from "@/components/breadcrumb"
import { FileToolbar } from "@/components/file-toolbar"
import { FilePreview } from "@/components/file-preview"
import { FileDetails } from "@/components/file-details"
import { useNotificationStore } from "@/stores"
import { UploadProgress } from "@/components/upload-progress"
import { FileConflictDialog } from "@/components/file-conflict-dialog"
import { SyncStatusDialog } from "@/components/sync-status-dialog"
import { motion, AnimatePresence } from "framer-motion"
import type { FileSystemItem } from "@/lib/types"
import { useIsMobile } from "@/hooks/use-mobile"
import { updateUrlWithPath, getPathFromUrl, processPath, findFileInPath } from "@/lib/utils/url"
import { useFileSystemStore, initializeFileSystemStore } from "@/stores/useFileSystemStore"

interface FileManagerProps {
  fileSystem: FileSystemItem[]
  setFileSystem: React.Dispatch<React.SetStateAction<FileSystemItem[]>>
  initialViewMode: "grid" | "list"
  initialPath?: string[]
  onViewModeChange: (mode: "grid" | "list") => void
}

interface FileManagerContentProps {
  initialViewMode: "grid" | "list"
  onViewModeChange: (mode: "grid" | "list") => void
}

function FileManagerContent({
  initialViewMode,
  onViewModeChange,
}: FileManagerContentProps) {
  const { addNotification } = useNotificationStore()

  // Use file system store
  const {
    clipboard,
    cutItems,
    copyItems,
    pasteItems,
    fileSystem,
    currentPath,
    selectedItems,
    viewMode,
    previewFile,
    detailsItem,
    setSelectedItems,
    navigateTo,
    setPreviewFile,
    setDetailsItem,
    setViewMode,
    getCurrentItems,
    getCurrentDirectoryInfo,
    updateDetailsWithDirectory,
    syncDialogOpen,
    setSyncDialogOpen,
    syncPaused,
    setSyncPaused,
    toggleSyncPause,
    uploads,
    conflicts,
    handleExternalFileDrop,
    handleConflictResolution,
    handleApplyToAll
  } = useFileSystemStore()

  // Local state
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false)

  const isMobile = useIsMobile()
  const fileManagerRef = useRef<HTMLDivElement>(null)

  // Set up the drag and drop detection for OS files
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      // Check if files are being dragged (from OS)
      if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
        setIsDraggingOver(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      // Only set to false if we're leaving the file manager area 
      // and not entering a child element
      if (!e.relatedTarget || !fileManagerRef.current?.contains(e.relatedTarget as Node)) {
        setIsDraggingOver(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        handleExternalFileDrop(e.dataTransfer.files);
      }
    };

    const element = fileManagerRef.current;
    if (element) {
      element.addEventListener('dragover', handleDragOver);
      element.addEventListener('dragleave', handleDragLeave);
      element.addEventListener('drop', handleDrop);
    }

    return () => {
      if (element) {
        element.removeEventListener('dragover', handleDragOver);
        element.removeEventListener('dragleave', handleDragLeave);
        element.removeEventListener('drop', handleDrop);
      }
    };
  }, [fileManagerRef, handleExternalFileDrop]);

  // Update details when directory changes
  useEffect(() => {
    updateDetailsWithDirectory();
  }, [currentPath, updateDetailsWithDirectory]);

  // Handle selection changes
  const handleSelectedItemsChange = (items: string[]) => {
    setSelectedItems(items);
    if (items.length === 0) {
      updateDetailsWithDirectory();
    } else {
      // Find the selected item directly from the fileSystem
      const findItemById = (id: string, items: FileSystemItem[] = fileSystem): FileSystemItem | null => {
        for (const item of items) {
          if (item.id === id) return item;
          if (item.type === "folder" && item.children) {
            const found = findItemById(id, item.children);
            if (found) return found;
          }
        }
        return null;
      };

      const selectedItem = findItemById(items[0]);
      if (selectedItem) {
        setDetailsItem(selectedItem);
      }
    }
  };

  // Keyboard shortcut handling
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
        }
      }
    },
    [selectedItems, clipboard, cutItems, copyItems, pasteItems],
  )

  // Add keyboard event listeners
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

  // Update view mode when it changes
  useEffect(() => {
    onViewModeChange(viewMode)
  }, [viewMode, onViewModeChange])

  // Close preview and update URL
  const closePreview = () => {
    setPreviewFile(null);
    // Update URL to remove the filename when closing preview
    updateUrlWithPath(currentPath);
  }

  const handleCloseDetails = () => {
    if (isMobile) {
      setMobileDetailsOpen(false);
    } else {
      setSelectedItems([]);
      updateDetailsWithDirectory();
    }
  };

  const handleSetDetailsItem = (item: FileSystemItem | null) => {
    setDetailsItem(item);
    if (item && isMobile) {
      setMobileDetailsOpen(true);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden" ref={fileManagerRef}>
      <FileToolbar />
      <Breadcrumb currentPath={currentPath} navigateTo={navigateTo} />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto p-4 relative">
          <FileExplorer
            items={getCurrentItems()}
            selectedItems={selectedItems}
            onSelectedItemsChange={handleSelectedItemsChange}
            onNavigate={navigateTo}
            setPreviewFile={setPreviewFile}
            currentPath={currentPath}
            viewMode={viewMode}
            getCurrentDirectoryInfo={getCurrentDirectoryInfo}
          />

          <AnimatePresence>
            {isDraggingOver && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center z-10"
              >
                <div className="bg-card border-2 border-dashed border-primary rounded-lg p-8 text-center">
                  <div className="text-2xl font-bold mb-2">Drop files here</div>
                  <div className="text-muted-foreground">
                    Files will be added to {currentPath.length > 0 ? `/${currentPath.join("/")}` : "the Workspace root"}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop: Always show details sidebar */}
        {!isMobile && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="border-l border-border overflow-hidden hidden md:block"
          >
            <FileDetails item={detailsItem || getCurrentDirectoryInfo()} onClose={handleCloseDetails} setDetailsItem={handleSetDetailsItem} />
          </motion.div>
        )}
      </div>

      {/* Mobile: File details shown as a slide-in panel from bottom */}
      <AnimatePresence>
        {isMobile && mobileDetailsOpen && detailsItem && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 bg-background z-50"
          >
            <FileDetails item={detailsItem} onClose={handleCloseDetails} setDetailsItem={handleSetDetailsItem} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {uploads.length > 0 && (
          <UploadProgress uploads={uploads} />
        )}
      </AnimatePresence>

      <FileConflictDialog
        conflicts={conflicts}
        onResolve={handleConflictResolution}
        onCancel={() => {/* Handle cancel */ }}
        onApplyToAll={handleApplyToAll}
      />

      <SyncStatusDialog
        open={syncDialogOpen}
        onClose={() => setSyncDialogOpen(false)}
        isPaused={syncPaused}
        onPauseChange={setSyncPaused}
      />

      {previewFile && <FilePreview file={previewFile} onClose={closePreview} />}
    </div>
  )
}

export function FileManager({ fileSystem, setFileSystem, initialViewMode, initialPath = [], onViewModeChange }: FileManagerProps) {
  const [syncPaused, setSyncPaused] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  // Initialize the file system store
  useEffect(() => {
    // Set initial state in the store
    initializeFileSystemStore(fileSystem, initialPath, initialViewMode);

    // Check for file in path on initial load
    const pathFromUrl = getPathFromUrl();
    const { dirPath, fileName } = processPath(pathFromUrl, fileSystem);

    if (dirPath.length > 0) {
      useFileSystemStore.getState().setCurrentPath(dirPath);
    }

    if (fileName) {
      const fileToOpen = findFileInPath(fileSystem, dirPath, fileName);
      if (fileToOpen) {
        useFileSystemStore.getState().setPreviewFile(fileToOpen);
      }
    }
  }, [fileSystem, setFileSystem, initialPath, initialViewMode]);

  // Listen for popstate events (when browser back/forward buttons are used)
  useEffect(() => {
    const handlePopState = () => {
      const pathSegments = getPathFromUrl();
      const { dirPath, fileName } = processPath(pathSegments, fileSystem);
      const store = useFileSystemStore.getState();

      // Update directory path
      store.setCurrentPath(dirPath);

      // If there's a file in the path, find and open it
      if (fileName) {
        setTimeout(() => {
          const fileToOpen = findFileInPath(fileSystem, dirPath, fileName);
          if (fileToOpen) {
            store.setPreviewFile(fileToOpen);
          }
        }, 100); // Allow time for path change to complete
      } else {
        // If no file in path, close any open preview
        store.setPreviewFile(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [fileSystem]);

  return (
    <FileManagerContent
      initialViewMode={initialViewMode}
      onViewModeChange={onViewModeChange}
    />
  )
}
