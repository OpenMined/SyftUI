export type SyncStatus =
  | "synced"
  | "syncing"
  | "pending"
  | "rejected"
  | "error"
  | "ignored"
  | "hidden";
export type PermissionType = "read" | "write" | "admin";
export type UploadStatus = "uploading" | "completed" | "error" | "paused";
export type ClipboardOperation = "cut" | "copy";

export type SortBy = "name" | "date" | "size" | "type";
export type SortDirection = "asc" | "desc";

export interface SortConfig {
  sortBy: SortBy;
  direction: SortDirection;
}

export interface Permission {
  id: string;
  name: string;
  email: string;
  type: PermissionType;
  avatar?: string;
}

export interface FileSystemItem {
  id: string;
  name: string;
  type: "file" | "folder";
  path: string;
  absolutePath: string;
  createdAt: string;
  modifiedAt: string;
  size?: number;
  children?: FileSystemItem[];
  syncStatus?: SyncStatus;
  permissions?: Permission[];
}

export interface UploadItem {
  id: string;
  name: string;
  progress: number;
  size: number;
  status: UploadStatus;
}

export interface ConflictItem {
  operation: "move" | "copy";
  sourceItem: FileSystemItem;
  existingItem: FileSystemItem;
}

export interface ClipboardItem {
  items: FileSystemItem[];
  sourcePath: string[];
  operation: ClipboardOperation;
}
