export type SyncStatus = "synced" | "syncing" | "pending" | "rejected" | "error" | "ignored" | "hidden"
export type PermissionType = "read" | "write" | "admin"
export type UploadStatus = "uploading" | "completed" | "error" | "paused"

export interface Permission {
  id: string
  name: string
  email: string
  type: PermissionType
  avatar?: string
}

export interface FileSystemItem {
  id: string
  name: string
  type: "file" | "folder"
  createdAt: string
  modifiedAt: string
  size?: number
  children?: FileSystemItem[]
  syncStatus?: SyncStatus
  permissions?: Permission[]
}

export interface UploadItem {
  id: string
  name: string
  progress: number
  size: number
  status: UploadStatus
}

export interface ConflictItem {
  file: File
  existingItem: FileSystemItem
  path: string[]
}
