"use client";

import { useEffect, useState } from "react";
import {
  X,
  Share2,
  Download,
  Trash2,
  Edit,
  Clock,
  Lock,
  Info,
} from "lucide-react";
import { FileIcon } from "@/components/workspace/file-icon";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SyncStatus } from "@/components/workspace/sync-status";
import { PermissionsDialog } from "@/components/workspace/permissions-dialog";
import { motion } from "framer-motion";
import type { FileSystemItem } from "@/lib/types";
import { formatFileSize } from "@/lib/utils";
import { useFileSystemStore } from "@/stores/useFileSystemStore";

interface FileDetailsProps {
  item: FileSystemItem;
  onClose: () => void;
  setDetailsItem?: (item: FileSystemItem | null) => void;
}

const getFileType = (item: FileSystemItem) => {
  if (item.type === "folder") {
    return "Folder";
  }

  const extension = item.name.split(".").pop()?.toLowerCase() || "";

  switch (extension) {
    case "pdf":
      return "PDF Document";
    case "doc":
    case "docx":
      return "Word Document";
    case "xls":
    case "xlsx":
      return "Excel Spreadsheet";
    case "ppt":
    case "pptx":
      return "PowerPoint Presentation";
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      return "Image";
    case "mp4":
    case "mov":
    case "avi":
      return "Video";
    case "mp3":
    case "wav":
      return "Audio";
    case "zip":
    case "rar":
      return "Archive";
    case "html":
    case "css":
    case "js":
      return "Web File";
    default:
      return `${extension.toUpperCase()} File`;
  }
};

export function FileDetails({
  item,
  onClose,
  setDetailsItem,
}: FileDetailsProps) {
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState();
  const [fileType, setFileType] = useState();
  const [fileExtension, setFileExtension] = useState();

  // Get file operations from the store
  const { handleDelete, handleRename } = useFileSystemStore();

  useEffect(() => {
    if (!item) return;
    setNewName(item.name);
    setFileType(getFileType(item));
    setFileExtension(item.name.split(".").pop()?.toLowerCase() || "");
    // Reset dialog state when item changes
    setIsPermissionsDialogOpen(false);
  }, [item]);

  const handleRenameSubmit = () => {
    if (newName.trim() && newName !== item.name) {
      handleRename(item.id, newName.trim());
    }
    setIsRenaming(false);
  };

  return item ? (
    <div className="bg-card flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="font-medium">Details</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 md:hidden"
        >
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

          <TabsContent value="details" className="space-y-6 p-4">
            <div className="flex flex-col items-center p-4 text-center">
              <div className="mb-4 h-20 w-20">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <FileIcon
                    type={item.type}
                    extension={fileExtension}
                    className="h-full w-full"
                  />
                </motion.div>
              </div>

              {isRenaming ? (
                <div className="flex w-full items-center gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded border px-2 py-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameSubmit();
                      if (e.key === "Escape") setIsRenaming(false);
                    }}
                    onBlur={handleRenameSubmit}
                  />
                </div>
              ) : (
                <h3 className="mb-1 text-lg font-medium break-all">
                  {item.name}
                </h3>
              )}

              <p className="text-muted-foreground text-sm">{fileType}</p>

              {item.syncStatus && item.syncStatus !== "hidden" && (
                <div className="mt-2">
                  <SyncStatus status={item.syncStatus} variant="badge" />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Info className="text-muted-foreground mr-2 h-4 w-4" />
                  <span className="font-medium">Basic Info</span>
                </div>
                <div className="grid grid-cols-[minmax(0,_0.6fr)_minmax(0,_1fr)] gap-2 pl-6 text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <span>{fileType}</span>

                  {item.size && (
                    <>
                      <span className="text-muted-foreground">Size:</span>
                      <span>{formatFileSize(item.size)}</span>
                    </>
                  )}

                  <span className="text-muted-foreground">Location:</span>
                  <span className="truncate">
                    /{item.type === "folder" ? "" : "..."}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Clock className="text-muted-foreground mr-2 h-4 w-4" />
                  <span className="font-medium">Time Info</span>
                </div>
                <div className="grid grid-cols-[minmax(0,_0.6fr)_minmax(0,_1fr)] gap-2 pl-6 text-sm">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(item.createdAt).toLocaleString()}</span>

                  <span className="text-muted-foreground">Modified:</span>
                  <span>{new Date(item.modifiedAt).toLocaleString()}</span>
                </div>
              </div>

              {item.permissions && (
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Lock className="text-muted-foreground mr-2 h-4 w-4" />
                    <span className="font-medium">Permissions</span>
                  </div>
                  <div className="grid grid-cols-[minmax(0,_0.6fr)_minmax(0,_1fr)] gap-2 pl-6 text-sm">
                    <span className="text-muted-foreground">Owner:</span>
                    <span>
                      {item.permissions.find((p) => p.type === "admin")?.name ||
                        "You"}
                    </span>

                    <span className="text-muted-foreground">Shared with:</span>
                    <span>
                      {item.permissions?.length > 1
                        ? `${item.permissions.length - 1} people`
                        : "No one"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="p-4">
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Recent activity for this item
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full">
                    U
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      You modified this file
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(item.modifiedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full">
                    U
                  </div>
                  <div>
                    <p className="text-sm font-medium">You created this file</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="p-4">
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Manage who has access to this item
              </p>

              <div className="space-y-2">
                {item.permissions ? (
                  item.permissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full">
                          {permission.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {permission.name}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {permission.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs font-medium capitalize">
                        {permission.type}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm">
                    Only you have access to this item
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setIsPermissionsDialogOpen(true)}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Manage Permissions
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {item.id !== "root-directory" && (
        <div className="border-t p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setIsRenaming(true)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Rename
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive flex-1"
              onClick={() => {
                handleDelete([item.id]);
                onClose();
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {isPermissionsDialogOpen && (
        <PermissionsDialog
          item={item}
          setDetailsItem={setDetailsItem ? setDetailsItem : undefined}
          onClose={() => setIsPermissionsDialogOpen(false)}
        />
      )}
    </div>
  ) : (
    <div className="bg-card flex h-full flex-col items-center justify-center">
      <p className="text-muted-foreground">No item selected</p>
    </div>
  );
}
