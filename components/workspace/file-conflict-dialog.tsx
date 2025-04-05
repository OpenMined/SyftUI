"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileIcon } from "@/components/workspace/file-icon";
import type { FileSystemItem } from "@/lib/types";
import { formatFileSize } from "@/lib/utils";

interface ConflictItem {
  file: File;
  existingItem: FileSystemItem;
  path: string[];
}

interface FileConflictDialogProps {
  conflicts: ConflictItem[];
  onResolve: (
    resolution: "replace" | "rename" | "skip",
    conflict: ConflictItem,
  ) => void;
  onApplyToAll: (resolution: "replace" | "rename" | "skip") => void;
  onCancel: () => void;
}

export function FileConflictDialog({
  conflicts,
  onResolve,
  onApplyToAll,
  onCancel,
}: FileConflictDialogProps) {
  const currentConflict = conflicts[0];

  if (!currentConflict) return null;

  const extension = currentConflict.file.name.split(".").pop()?.toLowerCase();

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>File Already Exists</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-4 flex items-center gap-4">
            <div className="h-12 w-12 shrink-0">
              <FileIcon type="file" extension={extension} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {currentConflict.file.name}
              </p>
              <p className="text-muted-foreground text-sm">
                {formatFileSize(currentConflict.file.size)}
              </p>
            </div>
          </div>

          <p className="mb-4 text-sm">
            A file with the same name already exists in this location. What
            would you like to do?
          </p>

          {conflicts.length > 1 && (
            <p className="text-muted-foreground mb-4 text-sm">
              {conflicts.length} conflicts found. Resolving 1 of{" "}
              {conflicts.length}.
            </p>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <div className="grid w-full grid-cols-1 gap-2">
            <Button
              variant="outline"
              className="justify-start font-normal"
              onClick={() => onResolve("replace", currentConflict)}
            >
              Replace the existing file
            </Button>
            <Button
              variant="outline"
              className="justify-start font-normal"
              onClick={() => onResolve("rename", currentConflict)}
            >
              Keep both files (rename the new file)
            </Button>
            <Button
              variant="outline"
              className="justify-start font-normal"
              onClick={() => onResolve("skip", currentConflict)}
            >
              Skip this file
            </Button>
          </div>

          {conflicts.length > 1 && (
            <div className="mt-2 flex w-full justify-between border-t pt-2">
              <Button variant="ghost" size="sm" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onApplyToAll("replace")}
              >
                Apply to all conflicts
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
