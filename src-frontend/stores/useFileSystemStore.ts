"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  FileSystemItem,
  SyncStatus,
  UploadItem,
  ConflictItem,
  ClipboardItem,
  Permission,
  SortConfig,
} from "@/lib/types";
import { updateUrlWithPath } from "@/lib/utils/url";
import { useNotificationStore } from "./useNotificationStore";
import {
  getWorkspaceItems,
  createWorkspaceItem,
  deleteWorkspaceItems,
  moveWorkspaceItem,
  copyWorkspaceItem,
} from "@/lib/api/workspace";
import { toast } from "@/hooks/use-toast";
import { useConflictDialogStore } from "@/stores/useConflictDialogStore";

const SYNC_COMPLETION_MS = 2000;
const NOTIFICATION_DELAY_MS = 5000;

interface FileSystemState {
  // Core state
  fileSystem: FileSystemItem[];
  currentPath: string[];
  selectedItems: string[];
  viewMode: "grid" | "list";
  sortConfig: SortConfig;
  showHiddenFiles: boolean;
  previewFile: FileSystemItem | null;
  detailsItem: FileSystemItem | null;
  isRefreshing: boolean;

  // Sync state
  syncPaused: boolean;
  syncDialogOpen: boolean;

  // Upload state
  uploads: UploadItem[];

  // Clipboard state
  clipboard: ClipboardItem | null;

  // File operations
  findItemById: (
    itemId: string,
    items?: FileSystemItem[],
  ) => FileSystemItem | null;
  findItemsByIds: (
    itemIds: string[],
    items?: FileSystemItem[],
    path?: string[],
  ) => { items: FileSystemItem[]; path: string[] }[];
  findItemByPath: (
    path: string,
    items?: FileSystemItem[],
  ) => FileSystemItem | null;
  deepCloneItems: (items: FileSystemItem[]) => FileSystemItem[];

  // Actions
  setFileSystem: (
    fs: FileSystemItem[] | ((prev: FileSystemItem[]) => FileSystemItem[]),
  ) => void;
  setCurrentPath: (path: string[]) => void;
  setSelectedItems: (items: string[]) => void;
  setViewMode: (mode: "grid" | "list") => void;
  setSortConfig: (config: SortConfig) => void;
  setShowHiddenFiles: (show: boolean) => void;
  setPreviewFile: (file: FileSystemItem | null) => void;
  setDetailsItem: (item: FileSystemItem | null) => void;

  // Sync actions
  setSyncPaused: (paused: boolean) => void;
  setSyncDialogOpen: (open: boolean) => void;
  updateSyncStatus: (itemId: string, status: SyncStatus) => void;
  triggerManualSync: () => void;
  toggleSyncPause: () => void;

  // Upload actions
  handleExternalFileDrop: (files: FileList) => void;
  clearUpload: (id: string) => void;

  // Clipboard actions
  cutItemsToClipboard: (itemIds: string[]) => void;
  copyItemsToClipboard: (itemIds: string[]) => void;
  pasteItemsFromClipboard: () => void;

  // Navigation
  navigateTo: (path: string[]) => void;

  // File operations
  handleCreateFolder: (name: string) => Promise<void>;
  handleCreateFile: (name: string) => Promise<void>;
  handleDelete: (paths: string[]) => Promise<void>;
  handleRename: (itemId: string, newName: string) => void;
  moveItems: (
    itemIds: string[],
    targetPath: string,
    overwrite?: boolean,
  ) => Promise<void>;
  copyItems: (
    itemIds: string[],
    targetPath: string,
    overwrite?: boolean,
  ) => Promise<void>;
  updatePermissions: (itemId: string, permissions: Permission[]) => void;
  refreshFileSystem: () => Promise<void>;

  // Helper methods
  getCurrentItems: () => FileSystemItem[];
  getCurrentDirectoryInfo: () => FileSystemItem | null;
  updateDetailsWithDirectory: () => void;
}

export const useFileSystemStore = create<FileSystemState>(
  persist(
    (set, get) => ({
      // Initial state
      fileSystem: [],
      currentPath: [],
      selectedItems: [],
      viewMode: "grid",
      sortConfig: { sortBy: "name", direction: "asc" } as SortConfig,
      showHiddenFiles: false,
      previewFile: null,
      detailsItem: null,
      isRefreshing: false,

      // Sync state
      syncPaused: false,
      syncDialogOpen: false,

      // Upload state
      uploads: [],

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
            const childResults = get().findItemsByIds(itemIds, item.children, [
              ...path,
              item.name,
            ]);
            result.push(...childResults);
          }
        }
        return result;
      },

      findItemByPath: (path, items = get().fileSystem) => {
        for (const item of items) {
          if (item.path === path) {
            return item;
          }

          if (item.type === "folder" && item.children) {
            const found = get().findItemByPath(path, item.children);
            if (found) return found;
          }
        }
        return null;
      },

      deepCloneItems: (items) => {
        return items.map((item) => {
          const newItem = {
            ...item,
            id: `${item.id}-copy-${Date.now()}`,
            syncStatus: "pending" as SyncStatus,
          };

          if (item.type === "folder" && item.children) {
            newItem.children = get().deepCloneItems(item.children);
          }
          return newItem;
        });
      },

      // Basic state setters
      setFileSystem: (fs) =>
        set((state) => ({
          fileSystem: typeof fs === "function" ? fs(state.fileSystem) : fs,
        })),
      setCurrentPath: (path) => set({ currentPath: path }),
      setSelectedItems: (items) => set({ selectedItems: items }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setSortConfig: (config) => set({ sortConfig: config }),
      setShowHiddenFiles: (show) => set({ showHiddenFiles: show }),
      setPreviewFile: (file) => set({ previewFile: file }),
      setDetailsItem: (item) => set({ detailsItem: item }),

      // Sync actions
      setSyncPaused: (paused) => set({ syncPaused: paused }),
      setSyncDialogOpen: (open) => set({ syncDialogOpen: open }),

      updateSyncStatus: (itemId, status) => {
        set((state) => {
          const updateStatus = (items: FileSystemItem[]): FileSystemItem[] => {
            return items.map((item) => {
              if (item.id === itemId) {
                return {
                  ...item,
                  syncStatus: status,
                };
              }

              if (item.type === "folder" && item.children) {
                return {
                  ...item,
                  children: updateStatus(item.children),
                };
              }

              return item;
            });
          };
          return { fileSystem: updateStatus(state.fileSystem) };
        });
      },

      triggerManualSync: () => {
        const state = get();
        const { fileSystem, updateSyncStatus } = state;
        const pendingItems: FileSystemItem[] = [];
        const notificationStore = useNotificationStore.getState();

        const findPendingItems = (items: FileSystemItem[]) => {
          items.forEach((item) => {
            if (item.syncStatus === "pending" || item.syncStatus === "error") {
              pendingItems.push(item);
            }

            if (item.type === "folder" && item.children) {
              findPendingItems(item.children);
            }
          });
        };

        findPendingItems(fileSystem);

        if (pendingItems.length === 0) {
          notificationStore.addNotification({
            title: "Nothing to Sync",
            message: "All files are already synced",
            type: "info",
          });
          return;
        }

        notificationStore.addNotification({
          title: "Sync Started",
          message: `Syncing ${pendingItems.length} item(s)`,
          type: "info",
        });

        pendingItems.forEach((item) => {
          updateSyncStatus(item.id, "syncing");

          setTimeout(
            () => {
              updateSyncStatus(item.id, "synced");
            },
            SYNC_COMPLETION_MS + Math.random() * 3000,
          );
        });

        setTimeout(() => {
          notificationStore.addNotification({
            title: "Sync Complete",
            message: `${pendingItems.length} item(s) have been synced`,
            type: "success",
          });
        }, NOTIFICATION_DELAY_MS);
      },

      toggleSyncPause: () => {
        const state = get();
        const newPausedState = !state.syncPaused;
        set({ syncPaused: newPausedState });
        const notificationStore = useNotificationStore.getState();
        notificationStore.addNotification({
          title: newPausedState ? "Sync Paused" : "Sync Resumed",
          message: newPausedState
            ? "File synchronization has been paused"
            : "File synchronization has been resumed",
          type: "info",
        });
      },

      handleExternalFileDrop: (files) => {
        console.log("handleExternalFileDrop", files);
      },

      clearUpload: (id) => {
        set((state) => ({
          uploads: state.uploads.filter((upload) => upload.id !== id),
        }));
      },

      // Clipboard actions
      cutItemsToClipboard: (itemIds) => {
        const state = get();
        const { findItemsByIds } = state;

        const foundItems = findItemsByIds(itemIds);
        if (foundItems.length > 0) {
          // Collect all items from all found locations
          const allItems = foundItems.flatMap((result) => result.items);
          // Use the path from the first result since we need a single source path
          const sourcePath = foundItems[0].path;

          set({
            clipboard: {
              items: allItems,
              sourcePath: sourcePath,
              operation: "cut",
            },
          });

          toast({
            icon: "✂️",
            title: "Items Cut",
            description: `${allItems.length} item(s) have been cut to the clipboard`,
            variant: "default",
          });
        }
      },

      copyItemsToClipboard: (itemIds) => {
        const state = get();
        const { findItemsByIds } = state;

        const foundItems = findItemsByIds(itemIds);
        if (foundItems.length > 0) {
          // Collect all items from all found locations
          const allItems = foundItems.flatMap((result) => result.items);
          // Use the path from the first result since we need a single source path
          const sourcePath = foundItems[0].path;

          set({
            clipboard: {
              items: allItems,
              sourcePath: sourcePath,
              operation: "copy",
            },
          });

          toast({
            icon: "📋",
            title: "Items Copied",
            description: `${allItems.length} item(s) have been copied to the clipboard`,
            variant: "default",
          });
        }
      },

      pasteItemsFromClipboard: async () => {
        const state = get();
        const { clipboard, copyItems, currentPath, moveItems } = state;

        if (!clipboard) return;

        const itemIds = clipboard.items.map((item) => item.id);

        if (clipboard.operation === "cut") {
          await moveItems(itemIds, currentPath);
          set({ clipboard: null });
        } else {
          await copyItems(itemIds, currentPath);
          // Keep clipboard content for potential future pastes
        }

        toast({
          icon: "📋",
          title: "Items Pasted",
          description: `${itemIds.length} item(s) have been pasted from the clipboard`,
          variant: "default",
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

      // File operations implementations
      handleCreateFolder: async (name) => {
        const isCreatedAtCurrentPath = !name.includes("/");

        try {
          const state = get();
          const { currentPath, findItemByPath, refreshFileSystem } = state;

          // Build the full path for the new folder
          const folderPath =
            currentPath.length === 0
              ? `/${name}`
              : `/${currentPath.join("/")}/${name}`;

          // Check if the folder already exists
          const existingItem = findItemByPath(folderPath);
          if (existingItem) {
            toast({
              icon: "⚠️",
              title: "Item already exists",
              description: `The name "${name}" is already taken. Please choose a different name.`,
              variant: "destructive",
            });
            return;
          }

          if (isCreatedAtCurrentPath) {
            // Create optimistic folder item
            const realName = name.split("/").pop();
            const optimisticFolder: FileSystemItem = {
              id: folderPath,
              name: realName,
              type: "folder",
              path: folderPath,
              createdAt: new Date().toISOString(),
              modifiedAt: new Date().toISOString(),
              syncStatus: "pending",
              children: [],
              size: 0,
            };

            // Add optimistic folder to the UI
            const updateFileSystem = (
              items: FileSystemItem[],
              path: string[],
              depth: number,
            ): FileSystemItem[] => {
              if (depth === path.length) {
                return [...items, optimisticFolder];
              }

              return items.map((item) => {
                if (item.type === "folder" && item.name === path[depth]) {
                  return {
                    ...item,
                    children: updateFileSystem(
                      item.children || [],
                      path,
                      depth + 1,
                    ),
                  };
                }
                return item;
              });
            };

            set((state) => ({
              fileSystem: updateFileSystem(
                [...state.fileSystem],
                currentPath,
                0,
              ),
            }));
          }

          // Call the API to create the folder
          await createWorkspaceItem({
            path: folderPath,
            type: "folder",
          });

          // Refresh the file system to get the real folder info
          if (isCreatedAtCurrentPath) await refreshFileSystem();
        } catch (error) {
          console.error("Error creating folder:", error);

          // Refresh the file system to remove the optimistic folder
          if (isCreatedAtCurrentPath) await get().refreshFileSystem();

          // Show error toast
          toast({
            icon: "⚠️",
            title: "Error Creating Folder",
            description: `Failed to create folder "${name}". ${error}`,
            variant: "destructive",
          });
        }
      },

      handleCreateFile: async (name) => {
        const isCreatedAtCurrentPath = !name.includes("/");

        try {
          const state = get();
          const { currentPath, findItemByPath, refreshFileSystem } = state;

          // Build the full path for the new file
          const filePath =
            currentPath.length === 0
              ? `/${name}`
              : `/${currentPath.join("/")}/${name}`;

          // Check if the file already exists
          const existingItem = findItemByPath(filePath);
          if (existingItem) {
            toast({
              icon: "⚠️",
              title: "Item already exists",
              description: `The name "${name}" is already taken. Please choose a different name.`,
              variant: "destructive",
            });
            return;
          }

          if (isCreatedAtCurrentPath) {
            // Create optimistic file item
            const optimisticFile: FileSystemItem = {
              id: filePath,
              name,
              type: "file",
              path: filePath,
              createdAt: new Date().toISOString(),
              modifiedAt: new Date().toISOString(),
              syncStatus: "syncing",
              size: 0,
            };

            // Add optimistic file to the UI
            if (currentPath.length === 0) {
              set((state) => ({
                fileSystem: [...state.fileSystem, optimisticFile],
              }));
            } else {
              const updateFileSystem = (
                items: FileSystemItem[],
                path: string[],
                depth: number,
              ): FileSystemItem[] => {
                if (depth === path.length) {
                  return [...items, optimisticFile];
                }

                return items.map((item) => {
                  if (item.type === "folder" && item.name === path[depth]) {
                    return {
                      ...item,
                      children: updateFileSystem(
                        item.children || [],
                        path,
                        depth + 1,
                      ),
                    };
                  }
                  return item;
                });
              };

              set((state) => ({
                fileSystem: updateFileSystem(
                  [...state.fileSystem],
                  currentPath,
                  0,
                ),
              }));
            }
          }

          // Call the API to create the file
          await createWorkspaceItem({
            path: filePath,
            type: "file",
          });

          // Refresh the file system to get the real file info
          if (isCreatedAtCurrentPath) await refreshFileSystem();
        } catch (error) {
          console.error("Error creating file:", error);

          // Refresh the file system to remove the optimistic file
          if (isCreatedAtCurrentPath) await get().refreshFileSystem();

          // Show error toast
          toast({
            icon: "⚠️",
            title: "Error Creating File",
            description: `Failed to create file "${name}". ${error}`,
            variant: "destructive",
          });
        }
      },

      handleDelete: async (paths) => {
        try {
          const state = get();
          const { currentPath, refreshFileSystem } = state;

          let destinationPath = currentPath;

          while (
            destinationPath.length > 0 &&
            paths.includes(`/${destinationPath.join("/")}`)
          ) {
            destinationPath = destinationPath.slice(0, -1);
          }

          // Call API to delete the items
          await deleteWorkspaceItems({ paths });

          // Refresh the file system to ensure UI matches server state
          await refreshFileSystem();

          // Update the current path
          set({ currentPath: destinationPath });

          // Show success toast
          toast({
            title: "Items Deleted",
            description: `${paths.length} item(s) have been deleted successfully`,
            variant: "default",
          });
        } catch (error) {
          console.error("Error deleting items:", error);

          // Refresh to restore the correct state
          await get().refreshFileSystem();

          // Show error toast
          toast({
            title: "Error Deleting Items",
            description: `Failed to delete items. ${error}`,
            variant: "destructive",
          });
        }
      },

      handleRename: async (itemId, newName) => {
        try {
          const { findItemById, findItemByPath, refreshFileSystem } = get();
          const itemPath = findItemById(itemId)?.path;
          const parentPath = itemPath.split("/").slice(0, -1).join("/");
          const destinationPath = parentPath + `/${newName}`;
          console.info(`Renaming ${itemPath} to ${destinationPath}`);

          // Check if the item already exists
          const existingItem = findItemByPath(destinationPath);
          if (existingItem) {
            toast({
              icon: "⚠️",
              title: "Item already exists",
              description: `The name "${newName}" is already taken. Please choose a different name.`,
              variant: "destructive",
            });
            return;
          }

          // TODO optimistic updates (optimistically rename the item in the UI, and revert if the server call fails)

          await moveWorkspaceItem(itemPath, destinationPath);
          await refreshFileSystem();
        } catch (error) {
          console.error("Error renaming item:", error);

          // Show error notification
          toast({
            icon: "⚠️",
            title: "Error Renaming Item",
            description: `Failed to rename item. ${error}`,
            variant: "destructive",
          });
        }
      },

      moveItems: async (itemIds, targetDir, overwrite = false) => {
        try {
          const state = get();
          const { refreshFileSystem } = state;

          // Convert target path array to string path
          const targetDirString =
            targetDir.length > 0 ? `/${targetDir.join("/")}` : "/";

          // Find all items to move
          const itemsToMove: FileSystemItem[] = [];
          const findItemsForMove = (items: FileSystemItem[]) => {
            for (const item of items) {
              if (itemIds.includes(item.id)) {
                itemsToMove.push(item);
              }

              if (item.type === "folder" && item.children) {
                findItemsForMove(item.children);
              }
            }
          };

          // Populate items to move
          findItemsForMove(state.fileSystem);

          // Call the API to move each item individually
          const conflictsList: ConflictItem[] = [];

          for (const item of itemsToMove) {
            const baseName = item.name;
            const newPath = targetDirString.trimEnd("/") + "/" + baseName;
            const { item: result, isConflict } = await moveWorkspaceItem(
              item.path,
              newPath,
              {
                overwrite,
              },
            );

            if (isConflict) {
              conflictsList.push({
                operation: "move",
                sourceItem: item,
                existingItem: result,
              });
            }
          }

          if (conflictsList.length > 0) {
            const conflictResponses = await useConflictDialogStore
              .getState()
              .showConflicts(conflictsList);
            for (const conflict of conflictResponses) {
              if (conflict.resolution === "skip") {
                continue;
              }

              if (conflict.resolution === "replace") {
                await moveWorkspaceItem(
                  conflict.conflict.sourceItem.path,
                  conflict.conflict.existingItem.path,
                  { overwrite: true },
                );
              }

              if (conflict.resolution === "rename") {
                const nameParts = conflict.conflict.sourceItem.name.split(".");
                const extension = nameParts.length > 1 ? nameParts.pop() : "";
                const parentPath = conflict.conflict.existingItem.path
                  .split("/")
                  .slice(0, -1)
                  .join("/");
                const baseName = nameParts.join(".");

                // Find the next available number for the copy
                let copyNumber = 1;
                let newName = `${baseName} copy`;
                let newPath =
                  parentPath +
                  "/" +
                  newName +
                  (extension ? `.${extension}` : "");

                // Keep trying until we find an available name
                while (true) {
                  const { isConflict } = await moveWorkspaceItem(
                    conflict.conflict.sourceItem.path,
                    newPath,
                    { overwrite: false },
                  );

                  if (!isConflict) break;

                  copyNumber++;
                  newName = `${baseName} copy ${copyNumber}`;
                  newPath =
                    parentPath +
                    "/" +
                    newName +
                    (extension ? `.${extension}` : "");
                }
              }
            }
          }

          // Refresh to get accurate state
          await refreshFileSystem();
        } catch (error) {
          console.error("Error moving items:", error);

          // Refresh to restore the correct state
          await get().refreshFileSystem();

          // Show error toast
          toast({
            icon: "⚠️",
            title: "Error Moving Items",
            description: `Failed to move items. ${error}`,
            variant: "destructive",
          });
        }
      },

      copyItems: async (itemIds, targetDir, overwrite = false) => {
        try {
          const state = get();
          const { refreshFileSystem } = state;

          // Convert target path array to string path
          const targetDirString =
            targetDir.length > 0 ? `/${targetDir.join("/")}` : "/";

          // Find all items to copy
          const itemsToCopy: FileSystemItem[] = [];
          const findItemsForCopy = (items: FileSystemItem[]) => {
            for (const item of items) {
              if (itemIds.includes(item.id)) {
                itemsToCopy.push(item);
              }

              if (item.type === "folder" && item.children) {
                findItemsForCopy(item.children);
              }
            }
          };

          // Populate items to copy
          findItemsForCopy(state.fileSystem);

          // Call the API to copy each item individually
          const conflictsList: ConflictItem[] = [];

          for (const item of itemsToCopy) {
            const baseName = item.name;
            const newPath = `${targetDirString}/${baseName}`;
            const { item: result, isConflict } = await copyWorkspaceItem(
              item.path,
              newPath,
              {
                overwrite,
              },
            );

            if (isConflict) {
              conflictsList.push({
                operation: "copy",
                sourceItem: item,
                existingItem: result,
              });
            }
          }

          if (conflictsList.length > 0) {
            const conflictResponses = await useConflictDialogStore
              .getState()
              .showConflicts(conflictsList);
            for (const conflict of conflictResponses) {
              if (conflict.resolution === "skip") {
                continue;
              }

              if (conflict.resolution === "replace") {
                await copyWorkspaceItem(
                  conflict.conflict.sourceItem.path,
                  conflict.conflict.existingItem.path,
                  { overwrite: true },
                );
              }

              if (conflict.resolution === "rename") {
                const nameParts = conflict.conflict.sourceItem.name.split(".");
                const extension = nameParts.length > 1 ? nameParts.pop() : "";
                const parentPath = conflict.conflict.existingItem.path
                  .split("/")
                  .slice(0, -1)
                  .join("/");
                const baseName = nameParts.join(".");

                // Find the next available number for the copy
                let copyNumber = 1;
                let newName = `${baseName} copy`;
                let newPath =
                  parentPath +
                  "/" +
                  newName +
                  (extension ? `.${extension}` : "");

                // Keep trying until we find an available name
                while (true) {
                  const { isConflict } = await copyWorkspaceItem(
                    conflict.conflict.sourceItem.path,
                    newPath,
                    { overwrite: false },
                  );

                  if (!isConflict) break;

                  copyNumber++;
                  newName = `${baseName} copy ${copyNumber}`;
                  newPath =
                    parentPath +
                    "/" +
                    newName +
                    (extension ? `.${extension}` : "");
                }
              }
            }
          }

          // Refresh to get accurate state
          await refreshFileSystem();
        } catch (error) {
          console.error("Error copying items:", error);

          // Refresh to restore the correct state
          await get().refreshFileSystem();

          // Show error toast
          toast({
            icon: "⚠️",
            title: "Error Copying Items",
            description: `Failed to copy items. ${error}`,
            variant: "destructive",
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

          const updateItemPermissions = (
            items: FileSystemItem[],
          ): FileSystemItem[] => {
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

          set((state) => ({
            fileSystem: updateItemPermissions(state.fileSystem),
          }));

          // Update the details panel if this item is currently displayed
          if (originalItem && originalItem.id === itemId) {
            const updatedItem = findItemById(itemId);
            if (updatedItem) {
              setDetailsItem(updatedItem);
            }
          }

          notificationStore.addNotification({
            title: "Permissions Updated",
            message: `Permissions for "${originalItem?.name || "item"}" have been updated`,
            type: "success",
          });
        } catch (error) {
          console.error("Error updating permissions:", error);
          const notificationStore = useNotificationStore.getState();
          notificationStore.addNotification({
            title: "Error Updating Permissions",
            message: `Failed to update permissions. ${error}`,
            type: "error",
          });
        }
      },

      // Helper methods
      getCurrentItems: () => {
        const { fileSystem, currentPath, showHiddenFiles, findItemByPath } =
          get();

        let items = [];

        if (currentPath.length === 0) {
          items = fileSystem;
        } else {
          const folder = findItemByPath(`/${currentPath.join("/")}`);

          if (!folder) {
            return [];
          }
          items = folder.children || [];
        }

        // Filter out hidden files if showHiddenFiles is false
        if (!showHiddenFiles) {
          return items.filter(
            (item) => item.name !== "Icon\r" && !item.name.startsWith("."),
          );
        }

        return items;
      },

      getCurrentDirectoryInfo: () => {
        const { currentPath, findItemByPath, getCurrentItems } = get();

        if (currentPath.length === 0) {
          return {
            id: "/",
            name: "Workspace",
            type: "folder" as const,
            children: getCurrentItems(),
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
            syncStatus: "hidden" as const,
            size: getCurrentItems().reduce(
              (total, item) => total + (item.size || 0),
              0,
            ),
          };
        }

        const currentDir = findItemByPath(`/${currentPath.join("/")}`);
        return currentDir;
      },

      updateDetailsWithDirectory: () => {
        const { selectedItems, getCurrentDirectoryInfo, setDetailsItem } =
          get();

        if (selectedItems.length === 0) {
          const dirInfo = getCurrentDirectoryInfo();
          setDetailsItem(dirInfo);
        }
      },

      // Refresh file system
      refreshFileSystem: async () => {
        set({ isRefreshing: true });

        try {
          const { currentPath, setCurrentPath, setPreviewFile } = get();

          // Always get the parent path in the memory
          const path = currentPath.slice(0, -1).join("/") || "/";
          const items = await getWorkspaceItems(path, 1);

          const isRoot = currentPath.length === 0;

          if (!isRoot) {
            // If the current path is a file, we need to set its parent path as the current path
            // and set the preview file to the current file
            const currentPathItem = items.find(
              (item) => item.path === `/${currentPath.join("/")}`,
            );

            if (currentPathItem && currentPathItem.type === "file") {
              const parentPath = currentPath.slice(0, -1);
              setCurrentPath(parentPath);
              await get().refreshFileSystem();
              setPreviewFile(currentPathItem);
              return;
            }
          }

          set({
            fileSystem: items,
            isRefreshing: false,
          });
        } catch (error) {
          console.error("Error refreshing file system:", error);
          set({ isRefreshing: false });
        }
      },
    }),
    {
      name: "file-system-preferences",
      // Only persist these specific user preferences
      partialize: (state) => ({
        viewMode: state.viewMode,
        showHiddenFiles: state.showHiddenFiles,
        sortConfig: state.sortConfig,
      }),
    },
  ),
);

// This function initializes the file system store
// It should be called from the FileManager component
export const initializeFileSystemStore = async (initialPath: string[] = []) => {
  const store = useFileSystemStore.getState();

  // Initialize state
  store.setCurrentPath(initialPath?.split("/") || []);
  await store.refreshFileSystem();
};
