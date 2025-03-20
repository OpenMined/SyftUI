"use client"

import { useState } from "react"
import { X, Share2, Download, Trash2, Edit, Clock, Lock, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SyncStatus } from "@/components/sync-status"
import { PermissionsDialog } from "@/components/permissions-dialog"
import { useFileSystem } from "@/components/contexts/file-system-context"
import { motion } from "framer-motion"
import type { FileSystemItem } from "@/lib/types"
import { formatFileSize } from "@/lib/utils"

interface FileDetailsProps {
  item: FileSystemItem
  onClose: () => void
}

export function FileDetails({ item, onClose }: FileDetailsProps) {
  // Ensure we have a valid item to display
  if (!item) {
    return (
      <div className="h-full flex flex-col bg-card items-center justify-center">
        <p className="text-muted-foreground">No item selected</p>
      </div>
    );
  }

  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false)
  const { handleDelete, handleRename } = useFileSystem()
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState(item.name)

  const handleRenameSubmit = () => {
    if (newName.trim() && newName !== item.name) {
      handleRename(item.id, newName.trim())
    }
    setIsRenaming(false)
  }

  const getFileTypeInfo = () => {
    if (item.type === "folder") {
      return {
        type: "Folder",
        icon: "📁",
      }
    }

    const extension = item.name.split(".").pop()?.toLowerCase() || ""

    switch (extension) {
      case "pdf":
        return { type: "PDF Document", icon: "📄" }
      case "doc":
      case "docx":
        return { type: "Word Document", icon: "📝" }
      case "xls":
      case "xlsx":
        return { type: "Excel Spreadsheet", icon: "📊" }
      case "ppt":
      case "pptx":
        return { type: "PowerPoint Presentation", icon: "📑" }
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return { type: "Image", icon: "🖼️" }
      case "mp4":
      case "mov":
      case "avi":
        return { type: "Video", icon: "🎬" }
      case "mp3":
      case "wav":
        return { type: "Audio", icon: "🎵" }
      case "zip":
      case "rar":
        return { type: "Archive", icon: "🗄️" }
      case "html":
      case "css":
      case "js":
        return { type: "Web File", icon: "🌐" }
      default:
        return { type: `${extension.toUpperCase()} File`, icon: "📄" }
    }
  }

  const fileTypeInfo = getFileTypeInfo()

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-medium">Details</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 md:hidden">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <Tabs defaultValue="details">
          <TabsList className="w-full">
            <TabsTrigger value="details" className="flex-1">
              Details
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex-1">
              Activity
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex-1">
              Permissions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="p-4 space-y-6">
            <div className="flex flex-col items-center text-center p-4">
              <div className="h-20 w-20 mb-4 text-6xl">
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}>
                  {fileTypeInfo.icon}
                </motion.div>
              </div>

              {isRenaming ? (
                <div className="w-full flex items-center gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-2 py-1 border rounded"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameSubmit()
                      if (e.key === "Escape") setIsRenaming(false)
                    }}
                    onBlur={handleRenameSubmit}
                  />
                </div>
              ) : (
                <h3 className="font-medium text-lg mb-1 break-all">{item.name}</h3>
              )}

              <p className="text-sm text-muted-foreground">{fileTypeInfo.type}</p>

              {item.syncStatus && (
                <div className="mt-2">
                  <SyncStatus status={item.syncStatus} variant="badge" />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Info className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">Basic Info</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm pl-6">
                  <span className="text-muted-foreground">Type:</span>
                  <span>{fileTypeInfo.type}</span>

                  {item.size && (
                    <>
                      <span className="text-muted-foreground">Size:</span>
                      <span>{formatFileSize(item.size)}</span>
                    </>
                  )}

                  <span className="text-muted-foreground">Location:</span>
                  <span className="truncate">/{item.type === "folder" ? "" : "..."}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">Time Info</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm pl-6">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(item.createdAt).toLocaleString()}</span>

                  <span className="text-muted-foreground">Modified:</span>
                  <span>{new Date(item.modifiedAt).toLocaleString()}</span>
                </div>
              </div>

              {item.permissions && (
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">Permissions</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm pl-6">
                    <span className="text-muted-foreground">Owner:</span>
                    <span>{item.permissions.find((p) => p.type === "owner")?.name || "You"}</span>

                    <span className="text-muted-foreground">Shared with:</span>
                    <span>{item.permissions?.length > 1 ? `${item.permissions.length - 1} people` : "No one"}</span>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="p-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Recent activity for this item</p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                    U
                  </div>
                  <div>
                    <p className="text-sm font-medium">You modified this file</p>
                    <p className="text-xs text-muted-foreground">{new Date(item.modifiedAt).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                    U
                  </div>
                  <div>
                    <p className="text-sm font-medium">You created this file</p>
                    <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="p-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Manage who has access to this item</p>

              <div className="space-y-2">
                {item.permissions ? (
                  item.permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                          {permission.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{permission.name}</p>
                          <p className="text-xs text-muted-foreground">{permission.email}</p>
                        </div>
                      </div>
                      <div className="text-xs font-medium capitalize">{permission.type}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm">Only you have access to this item</div>
                )}
              </div>

              <Button variant="outline" size="sm" className="w-full" onClick={() => setIsPermissionsDialogOpen(true)}>
                <Share2 className="h-4 w-4 mr-2" />
                Manage Permissions
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="p-4 border-t">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => setIsRenaming(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Rename
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-destructive hover:text-destructive"
            onClick={() => {
              handleDelete([item.id])
              onClose()
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {isPermissionsDialogOpen && <PermissionsDialog item={item} onClose={() => setIsPermissionsDialogOpen(false)} />}
    </div>
  )
}

