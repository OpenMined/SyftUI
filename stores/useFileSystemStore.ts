import { create } from 'zustand'
import { useFileOperations } from '@/components/services/file-operations'
import { mockFileSystem } from '@/lib/mock-data'
import type { FileSystemItem, SyncStatus, UploadItem, ConflictItem } from '@/lib/types'
import { updateUrlWithPath } from '@/lib/utils/url'
import { useNotificationStore } from './useNotificationStore'

// Configuration constants for sync timing
const SYNC_DELAY_MS = 1000;
const SYNC_COMPLETION_MS = 2000;
const NOTIFICATION_DELAY_MS = 5000;

interface FileSystemState {
  // Core state
  fileSystem: FileSystemItem[]
  currentPath: string[]
  selectedItems: string[]
  viewMode: 'grid' | 'list'
  sortConfig: { sortBy: 'name' | 'date' | 'size' | 'type', direction: 'asc' | 'desc' }
  previewFile: FileSystemItem | null
  detailsItem: FileSystemItem | null
  isRefreshing: boolean

  // Sync state
  syncPaused: boolean
  syncDialogOpen: boolean

  // Upload state
  uploads: UploadItem[]
  conflicts: ConflictItem[]

  // Actions
  setFileSystem: (fs: FileSystemItem[] | ((prev: FileSystemItem[]) => FileSystemItem[])) => void
  setCurrentPath: (path: string[]) => void
  setSelectedItems: (items: string[]) => void
  setViewMode: (mode: 'grid' | 'list') => void
  setSortConfig: (config: { sortBy: 'name' | 'date' | 'size' | 'type', direction: 'asc' | 'desc' }) => void
  setPreviewFile: (file: FileSystemItem | null) => void
  setDetailsItem: (item: FileSystemItem | null) => void

  // Sync actions
  setSyncPaused: (paused: boolean) => void
  setSyncDialogOpen: (open: boolean) => void
  updateSyncStatus: (itemId: string, status: SyncStatus) => void
  triggerManualSync: () => void
  toggleSyncPause: () => void

  // Upload actions
  handleExternalFileDrop: (files: FileList) => void
  handleConflictResolution: (resolution: "replace" | "rename" | "skip", conflict: ConflictItem) => void
  handleApplyToAll: (resolution: "replace" | "rename" | "skip") => void
  clearUpload: (id: string) => void
  processFiles: (files: File[]) => void

  // Navigation
  navigateTo: (path: string[]) => void

  // File operations
  handleCreateFolder: (name: string) => void
  handleCreateFile: (name: string) => void
  handleDelete: (itemIds: string[]) => void
  handleRename: (itemId: string, newName: string) => void
  moveItems: (itemIds: string[], targetPath: string[]) => void
  updatePermissions: (itemId: string, permissions: any) => void
  refreshFileSystem: () => void

  // Helper methods
  getCurrentItems: () => FileSystemItem[]
  getCurrentDirectoryInfo: () => FileSystemItem | null
  updateDetailsWithDirectory: () => void
}

export const useFileSystemStore = create<FileSystemState>((set, get) => {
  // We'll need to properly initialize these in the FileManager component
  return {
    // Initial state
    fileSystem: [],
    currentPath: [],
    selectedItems: [],
    viewMode: 'grid',
    sortConfig: { sortBy: 'name', direction: 'asc' },
    previewFile: null,
    detailsItem: null,
    isRefreshing: false,

    // Sync state
    syncPaused: false,
    syncDialogOpen: false,

    // Upload state
    uploads: [],
    conflicts: [],

    // Basic state setters
    setFileSystem: (fs) => set(state => ({
      fileSystem: typeof fs === 'function' ? fs(state.fileSystem) : fs
    })),
    setCurrentPath: (path) => set({ currentPath: path }),
    setSelectedItems: (items) => set({ selectedItems: items }),
    setViewMode: (mode) => set({ viewMode: mode }),
    setSortConfig: (config) => set({ sortConfig: config }),
    setPreviewFile: (file) => set({ previewFile: file }),
    setDetailsItem: (item) => set({ detailsItem: item }),

    // Sync actions
    setSyncPaused: (paused) => set({ syncPaused: paused }),
    setSyncDialogOpen: (open) => set({ syncDialogOpen: open }),

    updateSyncStatus: (itemId, status) => {
      set(state => {
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
        return { fileSystem: updateStatus(state.fileSystem) }
      })
    },

    triggerManualSync: () => {
      const state = get();
      const { fileSystem, updateSyncStatus } = state;
      const pendingItems: FileSystemItem[] = [];
      const notificationStore = useNotificationStore.getState();

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
        notificationStore.addNotification({
          title: "Nothing to Sync",
          message: "All files are already synced",
          type: "info",
        })
        return
      }

      notificationStore.addNotification({
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
          SYNC_COMPLETION_MS + Math.random() * 3000,
        )
      })

      setTimeout(() => {
        notificationStore.addNotification({
          title: "Sync Complete",
          message: `${pendingItems.length} item(s) have been synced`,
          type: "success",
        })
      }, NOTIFICATION_DELAY_MS)
    },

    toggleSyncPause: () => {
      const state = get();
      const newPausedState = !state.syncPaused;
      set({ syncPaused: newPausedState });
      
      const notificationStore = useNotificationStore.getState();
      notificationStore.addNotification({
        title: newPausedState ? "Sync Paused" : "Sync Resumed",
        message: newPausedState ? "File synchronization has been paused" : "File synchronization has been resumed",
        type: "info",
      });
    },

    // Upload actions
    processFiles: (files) => {
      const state = get();
      const { fileSystem, currentPath, updateSyncStatus } = state;
      const notificationStore = useNotificationStore.getState();

      const uploadItems: UploadItem[] = files.map((file) => ({
        id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: file.name,
        progress: 0,
        size: file.size,
        status: "uploading",
      }));

      set(state => ({ uploads: [...state.uploads, ...uploadItems] }));

      uploadItems.forEach((item) => {
        const interval = setInterval(() => {
          set(state => ({
            uploads: state.uploads.map((upload) => {
              if (upload.id === item.id) {
                const newProgress = Math.min(upload.progress + 10, 100);
                if (newProgress === 100) {
                  clearInterval(interval);
                  return { ...upload, progress: newProgress, status: "completed" };
                }
                return { ...upload, progress: newProgress };
              }
              return upload;
            }),
          }));
        }, 300);
      });

      const newFiles: FileSystemItem[] = files.map((file) => ({
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: file.name,
        type: "file",
        size: file.size,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        syncStatus: "pending",
      }));

      const addFiles = (items: FileSystemItem[], path: string[], depth: number): FileSystemItem[] => {
        if (depth === path.length) {
          return [...items, ...newFiles];
        }

        return items.map((item) => {
          if (item.type === "folder" && item.name === path[depth]) {
            return {
              ...item,
              children: addFiles(item.children || [], path, depth + 1),
            };
          }
          return item;
        });
      };

      set(state => ({
        fileSystem: addFiles([...state.fileSystem], currentPath, 0)
      }));

      newFiles.forEach((file) => {
        setTimeout(() => {
          updateSyncStatus(file.id, "syncing");

          setTimeout(() => {
            updateSyncStatus(file.id, "synced");
          }, 2000);
        }, 1000);
      });

      setTimeout(() => {
        set(state => ({
          uploads: state.uploads.filter(upload => upload.status !== "completed")
        }));
      }, 5000);

      notificationStore.addNotification({
        title: "Files Uploaded",
        message: `${files.length} file(s) have been uploaded`,
        type: "success",
      });
    },

    handleExternalFileDrop: (files) => {
      const state = get();
      const { fileSystem, currentPath, processFiles } = state;
      const currentItems = state.getCurrentItems();
      const conflictsList: ConflictItem[] = [];
      const nonConflictingFiles: File[] = [];

      Array.from(files).forEach((file) => {
        const existingItem = currentItems.find((item) => item.name === file.name);
        if (existingItem) {
          conflictsList.push({
            file,
            existingItem,
            path: currentPath,
          });
        } else {
          nonConflictingFiles.push(file);
        }
      });

      if (conflictsList.length > 0) {
        set({ conflicts: conflictsList });
      }

      if (nonConflictingFiles.length > 0) {
        processFiles(nonConflictingFiles);
      }
    },

    handleConflictResolution: (resolution, conflict) => {
      const state = get();
      const { processFiles } = state;

      if (resolution === "replace") {
        set(state => {
          const deleteFile = (items: FileSystemItem[]): FileSystemItem[] => {
            return items.filter(item => item.id !== conflict.existingItem.id)
              .map(item => {
                if (item.type === "folder" && item.children) {
                  return {
                    ...item,
                    children: deleteFile(item.children)
                  };
                }
                return item;
              });
          };
          return { fileSystem: deleteFile([...state.fileSystem]) };
        });

        processFiles([conflict.file]);
      } else if (resolution === "rename") {
        const nameParts = conflict.file.name.split(".");
        const extension = nameParts.length > 1 ? nameParts.pop() : "";
        const baseName = nameParts.join(".");
        const newName = `${baseName} (copy)${extension ? `.${extension}` : ""}`;

        const newFile = new File([conflict.file], newName, { type: conflict.file.type });
        processFiles([newFile]);
      }

      set(state => ({
        conflicts: state.conflicts.filter(c => c.file !== conflict.file)
      }));
    },

    handleApplyToAll: (resolution) => {
      const state = get();
      const { conflicts, processFiles } = state;

      if (resolution === "replace") {
        const itemIds = conflicts.map(conflict => conflict.existingItem.id);

        set(state => {
          const deleteFiles = (items: FileSystemItem[]): FileSystemItem[] => {
            return items.filter(item => !itemIds.includes(item.id))
              .map(item => {
                if (item.type === "folder" && item.children) {
                  return {
                    ...item,
                    children: deleteFiles(item.children)
                  };
                }
                return item;
              });
          };
          return { fileSystem: deleteFiles([...state.fileSystem]) };
        });

        const files = conflicts.map(conflict => conflict.file);
        processFiles(files);
      } else if (resolution === "rename") {
        const files = conflicts.map(conflict => {
          const nameParts = conflict.file.name.split(".");
          const extension = nameParts.length > 1 ? nameParts.pop() : "";
          const baseName = nameParts.join(".");
          const newName = `${baseName} (copy)${extension ? `.${extension}` : ""}`;
          return new File([conflict.file], newName, { type: conflict.file.type });
        });
        processFiles(files);
      }

      set({ conflicts: [] });
    },

    clearUpload: (id) => {
      set(state => ({
        uploads: state.uploads.filter(upload => upload.id !== id)
      }));
    },

    // Navigation
    navigateTo: (path) => {
      const { setCurrentPath, setSelectedItems, setDetailsItem } = get();
      setCurrentPath(path);
      setSelectedItems([]);
      setDetailsItem(null);

      // Update URL with the new path
      updateUrlWithPath(path);
    },

    // File operations - these will be properly initialized in the component
    handleCreateFolder: () => { },
    handleCreateFile: () => { },
    handleDelete: () => { },
    handleRename: () => { },
    moveItems: () => { },
    updatePermissions: () => { },

    // Helper methods
    getCurrentItems: () => {
      const { fileSystem, currentPath } = get();
      let current = fileSystem;

      for (const segment of currentPath) {
        const folder = current.find((item) => item.type === "folder" && item.name === segment);
        if (folder && folder.type === "folder" && folder.children) {
          current = folder.children;
        } else {
          return [];
        }
      }

      return current;
    },

    getCurrentDirectoryInfo: () => {
      const { fileSystem, currentPath, getCurrentItems } = get();

      if (currentPath.length === 0) {
        return {
          id: "root-directory",
          name: "Workspace",
          type: "folder" as const,
          children: getCurrentItems(),
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          syncStatus: "hidden" as const,
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
    },

    updateDetailsWithDirectory: () => {
      const { selectedItems, getCurrentDirectoryInfo, setDetailsItem } = get();

      if (selectedItems.length === 0) {
        const dirInfo = getCurrentDirectoryInfo();
        setDetailsItem(dirInfo);
      }
    },

    // Refresh file system
    refreshFileSystem: () => {
      set({ isRefreshing: true });

      // Simulate a minimum refresh time for better visual feedback
      setTimeout(() => {
        // For now, we just re-set the file system from the mock data
        set({
          fileSystem: [...mockFileSystem],
          isRefreshing: false
        });
      }, 750); // Show refreshing state for at least 750ms
    },
  };
});

// This function initializes the file operations in the store
// It should be called from the FileManager component
export const initializeFileSystemStore = (
  fileSystem: FileSystemItem[],
  setFileSystem: (fs: FileSystemItem[]) => void,
  initialPath: string[] = [],
  initialViewMode: 'grid' | 'list' = 'grid',
) => {
  const store = useFileSystemStore.getState();

  // Initialize state
  store.setFileSystem(fileSystem);
  store.setCurrentPath(initialPath);
  store.setViewMode(initialViewMode);

  // Setup file operations
  const fileOperations = useFileOperations(fileSystem, setFileSystem, store.currentPath);

  // Update store with file operations
  useFileSystemStore.setState({
    handleCreateFolder: (name) => {
      fileOperations.handleCreateFolder(name);
    },
    handleCreateFile: (name) => {
      fileOperations.handleCreateFile(name);
    },
    handleDelete: (itemIds) => {
      fileOperations.handleDelete(itemIds, store.setSelectedItems, store.setDetailsItem);
    },
    handleRename: (itemId, newName) => {
      fileOperations.handleRename(itemId, newName, store.setDetailsItem);
    },
    moveItems: (itemIds, targetPath) => {
      fileOperations.moveItems(itemIds, targetPath, store.setDetailsItem);
    },
    updatePermissions: (itemId, permissions) => {
      fileOperations.updatePermissions(itemId, permissions, store.setDetailsItem);
    },
  });
};
