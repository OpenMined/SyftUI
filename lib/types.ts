export type SyncStatus = "synced" | "syncing" | "pending" | "rejected" | "error" | "ignored" | "hidden"
export type PermissionType = "read" | "write" | "admin"

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

