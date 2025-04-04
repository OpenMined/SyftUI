"use client"

import { create } from 'zustand'
import { mockFileSystem } from '@/lib/mock-data'
import type { FileSystemItem, SyncStatus, UploadItem, ConflictItem, ClipboardItem, Permission } from '@/lib/types'
import { updateUrlWithPath } from '@/lib/utils/url'
import { useNotificationStore } from './useNotificationStore'

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

  // Clipboard state
  clipboard: ClipboardItem | null

  // File operations
  findItemById: (itemId: string, items?: FileSystemItem[]) => FileSystemItem | null
  findItemsByIds: (itemIds: string[], items?: FileSystemItem[], path?: string[]) => { items: FileSystemItem[]; path: string[] }[]
  deepCloneItems: (items: FileSystemItem[]) => FileSystemItem[]

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

  // Clipboard actions
  cutItems: (itemIds: string[]) => void
  copyItems: (itemIds: string[]) => void
  pasteItems: () => void

  // Navigation
  navigateTo: (path: string[]) => void

  // File operations
  handleCreateFolder: (name: string) => void
  handleCreateFile: (name: string) => void
  handleDelete: (itemIds: string[]) => void
  handleRename: (itemId: string, newName: string) => void
  moveItems: (itemIds: string[], targetPath: string[]) => void
  updatePermissions: (itemId: string, permissions: Permission[]) => void
  refreshFileSystem: () => void

  // Helper methods
  getCurrentItems: () => FileSystemItem[]
  getCurrentDirectoryInfo: () => FileSystemItem | null
  updateDetailsWithDirectory: () => void
}

export const useFileSystemStore = create<FileSystemState>((set, get) => {
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

    // Clipboard state
    clipboard: null,

    // File operations
    findItemById: (itemId, items = get().fileSystem) => {
      for (const item of items) {
        if (item.id === itemId) {
          return item;
        }

        if (item.type === "folder" && item.children) {
          const found = get().findItemById(itemId, item.children);
          if (found) return found;
        }
      }
      return null;
    },

    findItemsByIds: (itemIds, items = get().fileSystem, path = []) => {
      const result: { items: FileSystemItem[]; path: string[] }[] = [];

      for (const item of items) {
        if (itemIds.includes(item.id)) {
          result.push({ items: [item], path });
        }

        if (item.type === "folder" && item.children) {
          const childResults = get().findItemsByIds(itemIds, item.children, [...path, item.name]);
          result.push(...childResults);
        }
      }
      return result;
    },

    deepCloneItems: (items) => {
      return items.map((item) => {
        const newItem = { ...item, id: `${item.id}-copy-${Date.now()}`, syncStatus: "pending" };

        if (item.type === "folder" && item.children) {
          newItem.children = get().deepCloneItems(item.children);
        }
        return newItem;
      });
    },

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
      const { processFiles } = state;
      const currentItems = state.getCurrentItems();
      const conflictsList: ConflictItem[] = [];
      const nonConflictingFiles: File[] = [];

      Array.from(files).forEach((file) => {
        const existingItem = currentItems.find((item) => item.name === file.name);
        if (existingItem) {
          conflictsList.push({
            file,
            existingItem,
            path: state.currentPath,
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

    // Clipboard actions
    cutItems: (itemIds) => {
      const state = get();
      const { findItemsByIds } = state;
      const notificationStore = useNotificationStore.getState();

      const foundItems = findItemsByIds(itemIds);
      if (foundItems.length > 0) {
        const { items, path } = foundItems[0];
        set({
          clipboard: {
            items: items,
            sourcePath: path,
            operation: "cut",
          }
        });

        notificationStore.addNotification({
          title: "Items Cut",
          message: `${items.length} item(s) have been cut to clipboard`,
          type: "info",
        });
      }
    },

    copyItems: (itemIds) => {
      const state = get();
      const { findItemsByIds } = state;
      const notificationStore = useNotificationStore.getState();

      const foundItems = findItemsByIds(itemIds);
      if (foundItems.length > 0) {
        const { items, path } = foundItems[0];
        set({
          clipboard: {
            items: items,
            sourcePath: path,
            operation: "copy",
          }
        });

        notificationStore.addNotification({
          title: "Items Copied",
          message: `${items.length} item(s) have been copied to clipboard`,
          type: "info",
        });
      }
    },

    pasteItems: () => {
      const state = get();
      const { clipboard, currentPath, deepCloneItems } = state;
      const notificationStore = useNotificationStore.getState();

      if (!clipboard) return;

      if (clipboard.operation === "cut") {
        const itemIds = clipboard.items.map((item) => item.id);
        get().moveItems(itemIds, currentPath);
        set({ clipboard: null });
      } else {
        const clonedItems = deepCloneItems(clipboard.items);

        const addItems = (items: FileSystemItem[], path: string[], depth: number): FileSystemItem[] => {
          if (depth === path.length) {
            return [...items, ...clonedItems];
          }

          return items.map((item) => {
            if (item.type === "folder" && item.name === path[depth]) {
              return {
                ...item,
                children: addItems(item.children || [], path, depth + 1),
              };
            }
            return item;
          });
        };

        set(state => ({
          fileSystem: addItems([...state.fileSystem], currentPath, 0)
        }));

        notificationStore.addNotification({
          title: "Items Pasted",
          message: `${clonedItems.length} item(s) have been pasted`,
          type: "success",
        });
      }
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

    // File operations implementations
    handleCreateFolder: (name) => {
      try {
        const state = get();
        const { currentPath, updateSyncStatus } = state;
        const notificationStore = useNotificationStore.getState();

        const newFolder: FileSystemItem = {
          id: `folder-${Date.now()}`,
          name,
          type: "folder",
          children: [],
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          syncStatus: "pending",
        };

        if (currentPath.length === 0) {
          set(state => ({ fileSystem: [...state.fileSystem, newFolder] }));
        } else {
          const updateFileSystem = (items: FileSystemItem[], path: string[], depth: number): FileSystemItem[] => {
            if (depth === path.length) {
              return [...items, newFolder];
            }

            return items.map((item) => {
              if (item.type === "folder" && item.name === path[depth]) {
                return {
                  ...item,
                  children: updateFileSystem(item.children || [], path, depth + 1),
                };
              }
              return item;
            });
          };

          set(state => ({
            fileSystem: updateFileSystem([...state.fileSystem], currentPath, 0)
          }));
        }

        setTimeout(() => {
          updateSyncStatus(newFolder.id, "syncing");

          setTimeout(() => {
            updateSyncStatus(newFolder.id, "synced");
            notificationStore.addNotification({
              title: "Folder Created",
              message: `Folder "${name}" has been created and synced`,
              type: "success",
            });
          }, SYNC_COMPLETION_MS);
        }, SYNC_DELAY_MS);
      } catch (error) {
        console.error("Error creating folder:", error);
        const notificationStore = useNotificationStore.getState();
        notificationStore.addNotification({
          title: "Error Creating Folder",
          message: `Failed to create folder "${name}". Please try again.`,
          type: "error",
        });
      }
    },

    handleCreateFile: (name) => {
      try {
        const state = get();
        const { currentPath, updateSyncStatus } = state;
        const notificationStore = useNotificationStore.getState();

        const newFile: FileSystemItem = {
          id: `file-${Date.now()}`,
          name,
          type: "file",
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          syncStatus: "pending",
          size: 0,
        };

        if (currentPath.length === 0) {
          set(state => ({ fileSystem: [...state.fileSystem, newFile] }));
        } else {
          const updateFileSystem = (items: FileSystemItem[], path: string[], depth: number): FileSystemItem[] => {
            if (depth === path.length) {
              return [...items, newFile];
            }

            return items.map((item) => {
              if (item.type === "folder" && item.name === path[depth]) {
                return {
                  ...item,
                  children: updateFileSystem(item.children || [], path, depth + 1),
                };
              }
              return item;
            });
          };

          set(state => ({
            fileSystem: updateFileSystem([...state.fileSystem], currentPath, 0)
          }));
        }

        setTimeout(() => {
          updateSyncStatus(newFile.id, "syncing");

          setTimeout(() => {
            updateSyncStatus(newFile.id, "synced");
            notificationStore.addNotification({
              title: "File Created",
              message: `File "${name}" has been created and synced`,
              type: "success",
            });
          }, SYNC_COMPLETION_MS);
        }, SYNC_DELAY_MS);
      } catch (error) {
        console.error("Error creating file:", error);
        const notificationStore = useNotificationStore.getState();
        notificationStore.addNotification({
          title: "Error Creating File",
          message: `Failed to create file "${name}". Please try again.`,
          type: "error",
        });
      }
    },

    handleDelete: (itemIds) => {
      try {
        const state = get();
        const { setSelectedItems, setDetailsItem } = state;
        const notificationStore = useNotificationStore.getState();

        const itemsToDelete: FileSystemItem[] = [];

        const findItems = (items: FileSystemItem[]): FileSystemItem[] => {
          return items.filter((item) => {
            if (itemIds.includes(item.id)) {
              itemsToDelete.push(item);
              return false;
            }

            if (item.type === "folder" && item.children) {
              item.children = findItems(item.children);
            }

            return true;
          });
        };

        set(state => ({ fileSystem: findItems([...state.fileSystem]) }));

        setSelectedItems([]);

        const detailsItem = state.detailsItem;
        if (detailsItem && itemIds.includes(detailsItem.id)) {
          setDetailsItem(null);
        }

        notificationStore.addNotification({
          title: "Items Deleted",
          message: `${itemsToDelete.length} item(s) have been deleted`,
          type: "info",
        });
      } catch (error) {
        console.error("Error deleting items:", error);
        const notificationStore = useNotificationStore.getState();
        notificationStore.addNotification({
          title: "Error Deleting Items",
          message: "Failed to delete items. Please try again.",
          type: "error",
        });
      }
    },

    handleRename: (itemId, newName) => {
      try {
        const state = get();
        const { setDetailsItem, findItemById } = state;
        const notificationStore = useNotificationStore.getState();

        let oldName = "";

        const renameItem = (items: FileSystemItem[]): FileSystemItem[] => {
          return items.map((item) => {
            if (item.id === itemId) {
              oldName = item.name;
              return {
                ...item,
                name: newName,
                modifiedAt: new Date().toISOString(),
                syncStatus: "pending",
              };
            }

            if (item.type === "folder" && item.children) {
              return {
                ...item,
                children: renameItem(item.children),
              };
            }

            return item;
          });
        };

        set(state => ({ fileSystem: renameItem(state.fileSystem) }));

        const detailsItem = findItemById(itemId);
        if (detailsItem && detailsItem.id === itemId) {
          setDetailsItem({
            ...detailsItem,
            name: newName,
            modifiedAt: new Date().toISOString(),
            syncStatus: "pending",
          });
        }

        setTimeout(() => {
          state.updateSyncStatus(itemId, "syncing");

          setTimeout(() => {
            state.updateSyncStatus(itemId, "synced");
            notificationStore.addNotification({
              title: "Item Renamed",
              message: `"${oldName}" has been renamed to "${newName}"`,
              type: "success",
            });
          }, SYNC_COMPLETION_MS);
        }, SYNC_DELAY_MS);
      } catch (error) {
        console.error("Error renaming item:", error);
        const notificationStore = useNotificationStore.getState();
        notificationStore.addNotification({
          title: "Error Renaming Item",
          message: "Failed to rename item. Please try again.",
          type: "error",
        });
      }
    },

    moveItems: (itemIds, targetPath) => {
      try {
        const state = get();
        const { setDetailsItem, updateSyncStatus } = state;
        const notificationStore = useNotificationStore.getState();

        const itemsToMove: FileSystemItem[] = [];
        let sourcePath: string[] = [];

        const removeItems = (items: FileSystemItem[], path: string[] = []): FileSystemItem[] => {
          const remainingItems = items.filter((item) => {
            if (itemIds.includes(item.id)) {
              itemsToMove.push({ ...item, syncStatus: "pending" });
              sourcePath = path;
              return false;
            }
            return true;
          });

          return remainingItems.map((item) => {
            if (item.type === "folder" && item.children) {
              return {
                ...item,
                children: removeItems(item.children, [...path, item.name]),
              };
            }
            return item;
          });
        };

        const addItems = (items: FileSystemItem[], path: string[], depth: number): FileSystemItem[] => {
          if (depth === path.length) {
            return [...items, ...itemsToMove];
          }

          return items.map((item) => {
            if (item.type === "folder" && item.name === path[depth]) {
              return {
                ...item,
                children: addItems(item.children || [], path, depth + 1),
              };
            }
            return item;
          });
        };

        set(state => {
          const newFileSystem = removeItems([...state.fileSystem]);
          return { fileSystem: addItems(newFileSystem, targetPath, 0) };
        });

        const detailsItem = state.detailsItem;
        if (detailsItem && itemIds.includes(detailsItem.id)) {
          setDetailsItem(null);
        }

        itemsToMove.forEach((item) => {
          setTimeout(() => {
            updateSyncStatus(item.id, "syncing");

            setTimeout(() => {
              updateSyncStatus(item.id, "synced");
            }, SYNC_COMPLETION_MS);
          }, SYNC_DELAY_MS);
        });

        notificationStore.addNotification({
          title: "Items Moved",
          message: `${itemsToMove.length} item(s) have been moved`,
          type: "success",
        });
      } catch (error) {
        console.error("Error moving items:", error);
        const notificationStore = useNotificationStore.getState();
        notificationStore.addNotification({
          title: "Error Moving Items",
          message: "Failed to move items. Please try again.",
          type: "error",
        });
      }
    },

    updatePermissions: (itemId, permissions) => {
      try {
        const state = get();
        const { findItemById, setDetailsItem } = state;
        const notificationStore = useNotificationStore.getState();

        // Find the item before updating to check if it's currently displayed in details
        const originalItem = findItemById(itemId);

        const updateItemPermissions = (items: FileSystemItem[]): FileSystemItem[] => {
          return items.map((item) => {
            if (item.id === itemId) {
              return {
                ...item,
                permissions: permissions,
              };
            }

            if (item.type === "folder" && item.children) {
              return {
                ...item,
                children: updateItemPermissions(item.children),
              };
            }

            return item;
          });
        };

        set(state => ({ fileSystem: updateItemPermissions(state.fileSystem) }));

        // Update the details panel if this item is currently displayed
        if (originalItem && originalItem.id === itemId) {
          const updatedItem = findItemById(itemId);
          if (updatedItem) {
            setDetailsItem(updatedItem);
          }
        }

        notificationStore.addNotification({
          title: "Permissions Updated",
          message: `Permissions for "${originalItem?.name || 'item'}" have been updated`,
          type: "success",
        });
      } catch (error) {
        console.error("Error updating permissions:", error);
        const notificationStore = useNotificationStore.getState();
        notificationStore.addNotification({
          title: "Error Updating Permissions",
          message: "Failed to update permissions. Please try again.",
          type: "error",
        });
      }
    },

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

// This function initializes the file system store
// It should be called from the FileManager component
export const initializeFileSystemStore = (
  fileSystem: FileSystemItem[],
  initialPath: string[] = [],
  initialViewMode: 'grid' | 'list' = 'grid',
) => {
  const store = useFileSystemStore.getState();

  // Initialize state
  store.setFileSystem(fileSystem);
  store.setCurrentPath(initialPath);
  store.setViewMode(initialViewMode);
};