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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatFileSize } from "@/lib/utils";
import { useState } from "react";
import { useConflictDialogStore } from "@/stores/useConflictDialogStore";

export function FileConflictDialog() {
  const { conflicts, isOpen, closeDialog, currentIndex, handleResolution } =
    useConflictDialogStore();
  const [applyToAll, setApplyToAll] = useState(false);

  const currentConflict = conflicts[currentIndex];

  if (!currentConflict) return null;

  const extension = currentConflict.existingItem.name
    .split(".")
    .pop()
    ?.toLowerCase();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
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
                {currentConflict.existingItem.name}
              </p>
              <p className="text-muted-foreground text-sm">
                {formatFileSize(currentConflict.existingItem.size)}
              </p>
            </div>
          </div>

          <p className="mb-4 text-sm">
            A file with the same name already exists in this location. What
            would you like to do?
          </p>

          {conflicts.length > 1 && (
            <p className="text-muted-foreground mb-4 text-sm">
              {conflicts.length} conflicts found. Resolving {currentIndex + 1}{" "}
              of {conflicts.length}.
            </p>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <div className="grid w-full grid-cols-1 gap-2">
            <Button
              variant="outline"
              className="justify-start font-normal"
              onClick={() => handleResolution("replace", applyToAll)}
            >
              Replace the existing file
            </Button>
            <Button
              variant="outline"
              className="justify-start font-normal"
              onClick={() => handleResolution("rename", applyToAll)}
            >
              Keep both files (rename the new file)
            </Button>
            <Button
              variant="outline"
              className="justify-start font-normal"
              onClick={() => handleResolution("skip", applyToAll)}
            >
              Skip this file
            </Button>
          </div>

          {conflicts.length > 1 && (
            <div className="mt-2 flex w-full items-center justify-between border-t pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="apply-to-all"
                  checked={applyToAll}
                  onCheckedChange={(checked) => setApplyToAll(checked === true)}
                />
                <Label htmlFor="apply-to-all">
                  Apply to all remaining conflicts
                </Label>
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
