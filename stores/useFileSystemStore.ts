import { create } from 'zustand'
import { useFileOperations } from '@/components/services/file-operations'
import { mockFileSystem } from '@/lib/mock-data'
import type { FileSystemItem, SyncStatus } from '@/lib/types'
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
