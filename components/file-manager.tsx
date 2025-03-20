"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { FileExplorer } from "@/components/file-explorer"
import { Breadcrumb } from "@/components/breadcrumb"
import { FileToolbar } from "@/components/file-toolbar"
import { FilePreview } from "@/components/file-preview"
import { FileDetails } from "@/components/file-details"
import { useNotifications } from "@/components/notification-context"
import { UploadProgress } from "@/components/upload-progress"
import { FileConflictDialog } from "@/components/file-conflict-dialog"
import { SyncStatusDialog } from "@/components/sync-status-dialog"
import { SyncProvider, useSync } from "@/components/contexts/sync-context"
import { UploadProvider, useUpload } from "@/components/contexts/upload-context"
import { ClipboardProvider, useClipboard } from "@/components/contexts/clipboard-context"
import { motion, AnimatePresence } from "framer-motion"
import { FileSystemProvider, ClipboardItem } from "@/components/contexts/file-system-context"
import { useFileOperations } from "@/components/services/file-operations"
import type { FileSystemItem } from "@/lib/types"
import { useIsMobile } from "@/hooks/use-mobile"

interface FileManagerProps {
  fileSystem: FileSystemItem[]
  setFileSystem: React.Dispatch<React.SetStateAction<FileSystemItem[]>>
  initialViewMode: "grid" | "list"
  onViewModeChange: (mode: "grid" | "list") => void
}

interface FileManagerContentProps extends FileManagerProps {
  currentPath: string[];
  setCurrentPath: React.Dispatch<React.SetStateAction<string[]>>;
  selectedItems: string[];
  setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>;
  viewMode: 'grid' | 'list';
  setViewMode: React.Dispatch<React.SetStateAction<'grid' | 'list'>>;
  previewFile: FileSystemItem | null;
  setPreviewFile: React.Dispatch<React.SetStateAction<FileSystemItem | null>>;
}

// Create a wrapper component that will have access to all providers and be able to initialize file operations
function FileSystemProviderContent({
  fileSystem,
  setFileSystem,
  currentPath,
  selectedItems,
  viewMode,
  clipboard,
  syncPaused,
  setSelectedItems,
  navigateTo,
  setPreviewFile,
  setDetailsItem,
  setViewMode,
  setSyncDialogOpen,
  children
}: {
  fileSystem: FileSystemItem[],
  setFileSystem: React.Dispatch<React.SetStateAction<FileSystemItem[]>>,
  currentPath: string[],
  selectedItems: string[],
  viewMode: "grid" | "list",
  clipboard: ClipboardItem | null,
  syncPaused: boolean,
  setSelectedItems: (items: string[]) => void, 
  navigateTo: (path: string[]) => void,
  setPreviewFile: (file: FileSystemItem | null) => void,
  setDetailsItem: (item: FileSystemItem | null) => void,
  setViewMode: (mode: "grid" | "list") => void,
  setSyncDialogOpen: (open: boolean) => void,
  children: React.ReactNode
}) {
  // Initialize file operations service - now with all contexts available
  const fileOperations = useFileOperations(fileSystem, setFileSystem, currentPath);
  const { cutItems, copyItems, pasteItems } = useClipboard();

  return (
    <FileSystemProvider
      value={{
        fileSystem,
        setFileSystem,
        currentPath,
        selectedItems,
        viewMode,
        clipboard,
        syncPaused,
        setSelectedItems,
        setViewMode,
        navigateTo,
        handleCreateFolder: (name) => {
          fileOperations.handleCreateFolder(name);
        },
        handleDelete: (itemIds) => {
          fileOperations.handleDelete(itemIds, setSelectedItems, setDetailsItem);
        },
        handleRename: (itemId, newName) => {
          fileOperations.handleRename(itemId, newName, setDetailsItem);
        },
        setPreviewFile,
        setDetailsItem,
        moveItems: (itemIds, targetPath) => {
          fileOperations.moveItems(itemIds, targetPath, setDetailsItem);
        },
        cutItems,
        copyItems,
        pasteItems,
        updateSyncStatus: (itemId, status) => {
          // This will be handled by the sync context
        },
        updatePermissions: (itemId, permissions) => {
          fileOperations.updatePermissions(itemId, permissions);
        },
        toggleSyncPause: () => setSyncPaused(!syncPaused),
        triggerManualSync: () => {
          // This would trigger a manual sync if implemented
        },
        setSyncDialogOpen
      }}
    >
      {children}
    </FileSystemProvider>
  );
}

function FileManagerContent({ 
  fileSystem, 
  setFileSystem, 
  currentPath, 
  setCurrentPath, 
  initialViewMode, 
  onViewModeChange, 
  selectedItems, 
  setSelectedItems, 
  viewMode, 
  setViewMode,
  previewFile,
  setPreviewFile
}: FileManagerContentProps) {
  // Get context providers
  const { uploads, conflicts, handleExternalFileDrop, handleConflictResolution, handleApplyToAll } = useUpload()
  const { syncDialogOpen, setSyncDialogOpen, syncPaused } = useSync()
  const { clipboard, cutItems, copyItems, pasteItems } = useClipboard()
  const { addNotification } = useNotifications()
  
  // Local state
  const [detailsItem, setDetailsItem] = useState<FileSystemItem | null>(null)
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
  
  // Navigation function
  const navigateTo = (path: string[]) => {
    setCurrentPath(path)
    setSelectedItems([])
    setDetailsItem(null)
  }
  
  // Get current directory items
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
  
  // Get current directory info for details panel
  const getCurrentDirectoryInfo = useCallback(() => {
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
  
  // Update details when directory changes
  const updateDetailsWithDirectory = useCallback(() => {
    if (selectedItems.length === 0) {
      const dirInfo = getCurrentDirectoryInfo();
      setDetailsItem(dirInfo);
    }
  }, [selectedItems, getCurrentDirectoryInfo]);

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
  
  // Close preview
  const closePreview = () => setPreviewFile(null)
  
  // Handle mobile details panel
  const handleSetDetailsItem = useCallback((item: FileSystemItem | null) => {
    setDetailsItem(item);
    if (item && isMobile) {
      setMobileDetailsOpen(true);
    }
  }, [isMobile]);

  const handleCloseDetails = () => {
    if (isMobile) {
      setMobileDetailsOpen(false);
    } else {
      setSelectedItems([]);
      updateDetailsWithDirectory();
    }
  };
  
  return (
    <div className="flex flex-col flex-1 overflow-hidden" ref={fileManagerRef}>
      <FileToolbar sidebarOpen={false} setSidebarOpen={() => {}} />
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
          />

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

        {/* Desktop: Always show details sidebar */}
        {!isMobile && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="border-l border-border overflow-hidden hidden md:block"
          >
            <FileDetails item={detailsItem || getCurrentDirectoryInfo()} onClose={handleCloseDetails} />
          </motion.div>
        )}
      </div>

      {/* Mobile: File details shown as a slide-in panel */}
      <AnimatePresence>
        {isMobile && mobileDetailsOpen && detailsItem && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 bg-background z-50"
          >
            <FileDetails item={detailsItem} onClose={handleCloseDetails} />
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
        onCancel={() => setConflicts([])}
        onApplyToAll={handleApplyToAll}
      />

      <SyncStatusDialog
        open={syncDialogOpen}
        onClose={() => setSyncDialogOpen(false)}
        isPaused={syncPaused}
      />

      {previewFile && <FilePreview file={previewFile} onClose={closePreview} />}
    </div>
  )
}

export function FileManager({ fileSystem, setFileSystem, initialViewMode, onViewModeChange }: FileManagerProps) {
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">(initialViewMode);
  const [syncPaused, setSyncPaused] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);
  const [previewFile, setPreviewFile] = useState<FileSystemItem | null>(null);
  const [detailsItem, setDetailsItem] = useState<FileSystemItem | null>(null);
  
  useEffect(() => {
    onViewModeChange(viewMode);
  }, [viewMode, onViewModeChange]);
  
  return (
    <SyncProvider fileSystem={fileSystem} setFileSystem={setFileSystem}>
      <UploadProvider fileSystem={fileSystem} setFileSystem={setFileSystem} currentPath={currentPath}>
        <ClipboardProvider fileSystem={fileSystem} setFileSystem={setFileSystem} currentPath={currentPath}>
          <FileSystemProviderContent
            fileSystem={fileSystem}
            setFileSystem={setFileSystem}
            currentPath={currentPath}
            selectedItems={selectedItems}
            viewMode={viewMode}
            clipboard={clipboard}
            syncPaused={syncPaused}
            setSelectedItems={setSelectedItems}
            navigateTo={(path) => {
              setCurrentPath(path);
              setSelectedItems([]);
            }}
            setPreviewFile={setPreviewFile}
            setDetailsItem={setDetailsItem}
            setViewMode={setViewMode}
            setSyncDialogOpen={setSyncDialogOpen}
          >
            <FileManagerContent 
              fileSystem={fileSystem}
              setFileSystem={setFileSystem}
              currentPath={currentPath}
              setCurrentPath={setCurrentPath}
              initialViewMode={initialViewMode}
              onViewModeChange={onViewModeChange}
              selectedItems={selectedItems}
              setSelectedItems={setSelectedItems}
              viewMode={viewMode}
              setViewMode={setViewMode}
              previewFile={previewFile}
              setPreviewFile={setPreviewFile}
            />
          </FileSystemProviderContent>
        </ClipboardProvider>
      </UploadProvider>
    </SyncProvider>
  )
}
