"use client"

import { useState } from "react"
import type { FileSystemItem, Permission, PermissionType } from "@/lib/types"
import { useFileSystem } from "@/components/contexts/file-system-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus, Copy } from "lucide-react"

interface ShareDialogProps {
  item: FileSystemItem
  onClose: () => void
}

export function ShareDialog({ item, onClose }: ShareDialogProps) {
  const { updatePermissions } = useFileSystem()
  const [permissions, setPermissions] = useState<Permission[]>(
    item.permissions || [
      {
        id: "owner",
        name: "You",
        email: "user@example.com",
        type: "owner",
      },
    ],
  )
  const [newEmail, setNewEmail] = useState("")
  const [newPermissionType, setNewPermissionType] = useState<PermissionType>("view")
  const [shareLink, setShareLink] = useState(`https://example.com/share/${item.id}`)
  const [linkCopied, setLinkCopied] = useState(false)

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
    setPermissions(permissions.map((p) => (p.id === id ? { ...p, type } : p)))
  }

  const handleSave = () => {
    updatePermissions(item.id, permissions)
    onClose()
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{item.name}"</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">
                Share Link
              </Label>
              <Input id="link" value={shareLink} readOnly className="h-9" />
            </div>
            <Button type="button" size="sm" className="px-3" onClick={copyShareLink}>
              <span className="sr-only">Copy</span>
              {linkCopied ? "Copied!" : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>People with access</Label>
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
                      {permission.type !== "owner" ? (
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
                              <SelectItem value="view">Viewer</SelectItem>
                              <SelectItem value="comment">Commenter</SelectItem>
                              <SelectItem value="edit">Editor</SelectItem>
                              <SelectItem value="share">Can share</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" onClick={() => handleRemovePermission(permission.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs font-medium">Owner</span>
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
                <SelectItem value="view">Viewer</SelectItem>
                <SelectItem value="comment">Commenter</SelectItem>
                <SelectItem value="edit">Editor</SelectItem>
                <SelectItem value="share">Can share</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" size="icon" className="h-9 w-9" onClick={handleAddPermission}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <div className="text-xs text-muted-foreground">
            {item.type === "folder" ? "All items in this folder will inherit these permissions" : ""}
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

