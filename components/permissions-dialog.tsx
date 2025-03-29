"use client"

import { useState } from "react"
import type { FileSystemItem, Permission, PermissionType } from "@/lib/types"
import { useFileSystem } from "@/components/contexts/file-system-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { X, Plus, Copy, Info } from "lucide-react"

interface PermissionsDialogProps {
  item: FileSystemItem
  onClose: () => void
  setDetailsItem?: (item: FileSystemItem | null) => void
}

interface FolderLimits {
  maxStorage?: string
  maxFiles?: number
  maxFileSize?: string
  folderDepth?: number
  fileTypeRestrictions?: {
    allowed?: string[]
    disallowed?: string[]
  }
}

export function PermissionsDialog({ item, onClose, setDetailsItem }: PermissionsDialogProps) {
  const { updatePermissions } = useFileSystem()
  // Initialize with an empty array if no permissions exist
  const [permissions, setPermissions] = useState<Permission[]>(
    item.permissions || [
      {
        id: "admin",
        name: "You",
        email: "user@example.com",
        type: "admin",
      },
    ],
  )
  const [newEmail, setNewEmail] = useState("")
  const [newPermissionType, setNewPermissionType] = useState<PermissionType>("read")
  const [activeTab, setActiveTab] = useState<string>("permissions")
  const [limits, setLimits] = useState<FolderLimits>({
    maxStorage: "",
    maxFiles: undefined,
    maxFileSize: "",
    folderDepth: undefined,
    fileTypeRestrictions: {
      allowed: [],
      disallowed: [],
    }
  })

  const handleAddPermission = () => {
    if (!newEmail.trim() || !newEmail.includes("@")) return

    const newPermission: Permission = {
      id: `user-${Date.now()}`,
      name: newEmail.split("@")[0],
      email: newEmail,
      type: newPermissionType,
    }

    setPermissions([...permissions, newPermission])
    setNewEmail("")
  }

  const handleRemovePermission = (id: string) => {
    setPermissions(permissions.filter((p) => p.id !== id))
  }

  const handleUpdatePermissionType = (id: string, type: PermissionType) => {
    // Allow changes for all users except current user (which is handled by the UI)
    setPermissions(permissions.map((p) => (p.id === id ? { ...p, type } : p)))
  }

  const handleSave = () => {
    // Update the file system
    updatePermissions(item.id, permissions)

    // Directly update details item if provided
    if (setDetailsItem) {
      // Create updated item with new permissions
      const updatedItem = {
        ...item,
        permissions: permissions
      }
      setDetailsItem(updatedItem)
    }

    onClose()
  }

  const updateAllowedFileTypes = (value: string) => {
    const types = value.split("\n").filter(type => type.trim() !== "")
    setLimits({
      ...limits,
      fileTypeRestrictions: {
        ...limits.fileTypeRestrictions,
        allowed: types
      }
    })
  }

  const updateDisallowedFileTypes = (value: string) => {
    const types = value.split("\n").filter(type => type.trim() !== "")
    setLimits({
      ...limits,
      fileTypeRestrictions: {
        ...limits.fileTypeRestrictions,
        disallowed: types
      }
    })
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Permissions for "{item.name}"</DialogTitle>
        </DialogHeader>

        <div className="text-sm font-medium bg-muted/50 p-2 rounded-md mb-2">
          Effective permissions file: <span className="text-red-500 px-1 rounded font-mono">./syft.pub.yaml</span>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="permissions">People with access</TabsTrigger>
            {item.type === "folder" && (
              <TabsTrigger value="limits">Limits</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="permissions" className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="rounded-md border">
                <div className="divide-y">
                  {permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center justify-between p-2">
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                          {permission.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{permission.name}</p>
                          <p className="text-xs text-muted-foreground">{permission.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {permission.id !== "admin" ? (
                          <>
                            <Select
                              value={permission.type}
                              onValueChange={(value) =>
                                handleUpdatePermissionType(permission.id, value as PermissionType)
                              }
                            >
                              <SelectTrigger className="h-8 w-[110px]">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="read">Read</SelectItem>
                                <SelectItem value="write">Write</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button variant="ghost" size="icon" onClick={() => handleRemovePermission(permission.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs font-medium cursor-default">{permission.type === 'read' ? 'Read' : permission.type === 'write' ? 'Write' : 'Admin'}</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">You cannot change your own access level</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-end gap-2">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="email">Add people</Label>
                <Input
                  id="email"
                  placeholder="Email address"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="h-9"
                />
              </div>
              <Select value={newPermissionType} onValueChange={(value) => setNewPermissionType(value as PermissionType)}>
                <SelectTrigger className="h-9 w-[110px]">
                  <SelectValue placeholder="Permission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="write">Write</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" size="icon" className="h-9 w-9" onClick={handleAddPermission}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {item.type === "folder" && (
            <TabsContent value="limits" className="space-y-4 py-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="maxStorage">Max storage</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Maximum total size (e.g., '1GB') for all files in this folder</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="maxStorage"
                      placeholder="e.g., 1GB"
                      value={limits.maxStorage}
                      onChange={(e) => setLimits({ ...limits, maxStorage: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="maxFiles">Max files</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Maximum number of files allowed in this folder</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="maxFiles"
                      type="number"
                      placeholder="e.g., 100"
                      value={limits.maxFiles || ""}
                      onChange={(e) =>
                        setLimits({ ...limits, maxFiles: Number.parseInt(e.target.value) || undefined })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="maxFileSize">Max file size</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Maximum size of a single file (e.g., '50MB')</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="maxFileSize"
                      placeholder="e.g., 50MB"
                      value={limits.maxFileSize}
                      onChange={(e) => setLimits({ ...limits, maxFileSize: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="folderDepth">Folder depth</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Maximum number of nested subfolders allowed under this path</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="folderDepth"
                      type="number"
                      placeholder="e.g., 5"
                      value={limits.folderDepth || ""}
                      onChange={(e) =>
                        setLimits({ ...limits, folderDepth: Number.parseInt(e.target.value) || undefined })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="allowedTypes">Allowed file types</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">List of allowed file extensions e.g., ['.txt', '.csv']</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Textarea
                    id="allowedTypes"
                    placeholder="One extension per line, e.g., .txt"
                    value={limits.fileTypeRestrictions?.allowed?.join("\n") || ""}
                    onChange={(e) => updateAllowedFileTypes(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="disallowedTypes">Disallowed file types</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">List of forbidden file extensions. e.g., ['.exe','.zip']</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Textarea
                    id="disallowedTypes"
                    placeholder="One extension per line, e.g., .exe"
                    value={limits.fileTypeRestrictions?.disallowed?.join("\n") || ""}
                    onChange={(e) => updateDisallowedFileTypes(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter className="sm:justify-between">
          <div className="text-xs text-muted-foreground">
            {item.type === "folder" ? "All items in this folder will inherit these permissions unless overridden." : ""}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
