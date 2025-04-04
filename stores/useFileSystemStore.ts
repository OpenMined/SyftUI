import { create } from 'zustand'
import { useFileOperations } from '@/components/services/file-operations'
import { mockFileSystem } from '@/lib/mock-data'
import type { FileSystemItem } from '@/lib/types'
import { updateUrlWithPath } from '@/lib/utils/url'

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

  // Actions
  setFileSystem: (fs: FileSystemItem[] | ((prev: FileSystemItem[]) => FileSystemItem[])) => void
  setCurrentPath: (path: string[]) => void
  setSelectedItems: (items: string[]) => void
  setViewMode: (mode: 'grid' | 'list') => void
  setSortConfig: (config: { sortBy: 'name' | 'date' | 'size' | 'type', direction: 'asc' | 'desc' }) => void
  setPreviewFile: (file: FileSystemItem | null) => void
  setDetailsItem: (item: FileSystemItem | null) => void

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
