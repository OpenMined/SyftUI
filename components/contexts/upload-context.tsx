"use client"

import React, { createContext, useContext, useState } from "react"
import { useFileSystemStore, useNotificationStore } from "@/stores"
import type { FileSystemItem, UploadItem, ConflictItem } from "@/lib/types"

interface UploadContextType {
  uploads: UploadItem[]
  conflicts: ConflictItem[]
  handleExternalFileDrop: (files: FileList) => void
  handleConflictResolution: (resolution: "replace" | "rename" | "skip", conflict: ConflictItem) => void
  handleApplyToAll: (resolution: "replace" | "rename" | "skip") => void
  clearUpload: (id: string) => void
}

const UploadContext = createContext<UploadContextType | undefined>(undefined)

export function UploadProvider({
  children,
  fileSystem,
  setFileSystem,
  currentPath,
}: {
  children: React.ReactNode
  fileSystem: FileSystemItem[]
  setFileSystem: React.Dispatch<React.SetStateAction<FileSystemItem[]>>
  currentPath: string[]
}) {
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [conflicts, setConflicts] = useState<ConflictItem[]>([])
  const { addNotification } = useNotificationStore()
  const { updateSyncStatus } = useFileSystemStore()

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

  const processFiles = (files: File[]) => {
    const uploadItems: UploadItem[] = files.map((file) => ({
      id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: file.name,
      progress: 0,
      size: file.size,
      status: "uploading",
    }))

    setUploads((prev) => [...prev, ...uploadItems])

    uploadItems.forEach((item) => {
      const interval = setInterval(() => {
        setUploads((prev) =>
          prev.map((upload) => {
            if (upload.id === item.id) {
              const newProgress = Math.min(upload.progress + 10, 100)
              if (newProgress === 100) {
                clearInterval(interval)
                return { ...upload, progress: newProgress, status: "completed" }
              }
              return { ...upload, progress: newProgress }
            }
            return upload
          }),
        )
      }, 300)
    })

    const newFiles: FileSystemItem[] = files.map((file) => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: file.name,
      type: "file",
      size: file.size,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      syncStatus: "pending",
    }))

    const addFiles = (items: FileSystemItem[], path: string[], depth: number): FileSystemItem[] => {
      if (depth === path.length) {
        return [...items, ...newFiles]
      }

      return items.map((item) => {
        if (item.type === "folder" && item.name === path[depth]) {
          return {
            ...item,
            children: addFiles(item.children || [], path, depth + 1),
          }
        }
        return item
      })
    }

    setFileSystem(addFiles([...fileSystem], currentPath, 0))

    newFiles.forEach((file) => {
      setTimeout(() => {
        updateSyncStatus(file.id, "syncing")

        setTimeout(() => {
          updateSyncStatus(file.id, "synced")
        }, 2000)
      }, 1000)
    })

    setTimeout(() => {
      setUploads((prev) => prev.filter((upload) => upload.status !== "completed"))
    }, 5000)

    addNotification({
      title: "Files Uploaded",
      message: `${files.length} file(s) have been uploaded`,
      type: "success",
    })
  }

  const handleExternalFileDrop = (files: FileList) => {
    const currentItems = getCurrentItems()
    const conflictsList: ConflictItem[] = []
    const nonConflictingFiles: File[] = []

    Array.from(files).forEach((file) => {
      const existingItem = currentItems.find((item) => item.name === file.name)
      if (existingItem) {
        conflictsList.push({
          file,
          existingItem,
          path: currentPath,
        })
      } else {
        nonConflictingFiles.push(file)
      }
    })

    if (conflictsList.length > 0) {
      setConflicts(conflictsList)
    }

    if (nonConflictingFiles.length > 0) {
      processFiles(nonConflictingFiles)
    }
  }

  const handleConflictResolution = (resolution: "replace" | "rename" | "skip", conflict: ConflictItem) => {
    if (resolution === "replace") {
      const deleteFile = (items: FileSystemItem[]): FileSystemItem[] => {
        return items.filter(item => item.id !== conflict.existingItem.id)
          .map(item => {
            if (item.type === "folder" && item.children) {
              return {
                ...item,
                children: deleteFile(item.children)
              }
            }
            return item
          })
      }

      setFileSystem(deleteFile([...fileSystem]))
      processFiles([conflict.file])
    } else if (resolution === "rename") {
      const nameParts = conflict.file.name.split(".")
      const extension = nameParts.length > 1 ? nameParts.pop() : ""
      const baseName = nameParts.join(".")
      const newName = `${baseName} (copy)${extension ? `.${extension}` : ""}`

      const newFile = new File([conflict.file], newName, { type: conflict.file.type })
      processFiles([newFile])
    }

    setConflicts((prev) => prev.filter((c) => c.file !== conflict.file))
  }

  const handleApplyToAll = (resolution: "replace" | "rename" | "skip") => {
    if (resolution === "replace") {
      const itemIds = conflicts.map((conflict) => conflict.existingItem.id)

      const deleteFiles = (items: FileSystemItem[]): FileSystemItem[] => {
        return items.filter(item => !itemIds.includes(item.id))
          .map(item => {
            if (item.type === "folder" && item.children) {
              return {
                ...item,
                children: deleteFiles(item.children)
              }
            }
            return item
          })
      }

      setFileSystem(deleteFiles([...fileSystem]))

      const files = conflicts.map((conflict) => conflict.file)
      processFiles(files)
    } else if (resolution === "rename") {
      const files = conflicts.map((conflict) => {
        const nameParts = conflict.file.name.split(".")
        const extension = nameParts.length > 1 ? nameParts.pop() : ""
        const baseName = nameParts.join(".")
        const newName = `${baseName} (copy)${extension ? `.${extension}` : ""}`
        return new File([conflict.file], newName, { type: conflict.file.type })
      })
      processFiles(files)
    }

    setConflicts([])
  }

  const clearUpload = (id: string) => {
    setUploads((prev) => prev.filter((upload) => upload.id !== id))
  }

  const value = {
    uploads,
    conflicts,
    handleExternalFileDrop,
    handleConflictResolution,
    handleApplyToAll,
    clearUpload,
  }

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>
}

export function useUpload() {
  const context = useContext(UploadContext)
  if (context === undefined) {
    throw new Error("useUpload must be used within an UploadProvider")
  }
  return context
}
