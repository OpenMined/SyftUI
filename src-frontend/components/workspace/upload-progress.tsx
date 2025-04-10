"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { UploadItem } from "@/lib/types";

interface UploadProgressProps {
  uploads: UploadItem[];
  onClear: (id: string) => void;
}

export function UploadProgress({ uploads, onClear }: UploadProgressProps) {
  const activeUploads = uploads.filter(
    (upload) => upload.status === "uploading",
  );

  const totalProgress =
    activeUploads.length > 0
      ? activeUploads.reduce((sum, upload) => sum + upload.progress, 0) /
        activeUploads.length
      : 100;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="bg-card border-border fixed right-4 bottom-4 z-50 w-80 overflow-hidden rounded-lg border shadow-lg"
    >
      <div className="border-border flex items-center justify-between border-b p-3">
        <div className="font-medium">
          {activeUploads.length > 0
            ? `Uploading ${activeUploads.length} file${activeUploads.length > 1 ? "s" : ""}...`
            : "Upload Complete"}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => uploads.forEach((u) => onClear(u.id))}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="max-h-60 overflow-y-auto">
        <AnimatePresence>
          {uploads.map((upload) => (
            <motion.div
              key={upload.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-border border-b p-3 last:border-0"
            >
              <div className="mb-1 flex items-center justify-between">
                <div className="mr-2 flex-1 truncate text-sm">
                  {upload.name}
                </div>
                <div
                  className={cn(
                    "text-xs font-medium",
                    upload.status === "completed" && "text-green-500",
                    upload.status === "error" && "text-red-500",
                  )}
                >
                  {upload.status === "uploading" &&
                    `${Math.round(upload.progress)}%`}
                  {upload.status === "completed" && "Complete"}
                  {upload.status === "error" && "Failed"}
                </div>
              </div>

              {upload.status === "uploading" && (
                <Progress value={upload.progress} className="h-1" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="bg-muted/50 p-3">
        <div className="mb-1 flex items-center justify-between">
          <div className="text-sm font-medium">Total Progress</div>
          <div className="text-xs">{Math.round(totalProgress)}%</div>
        </div>
        <Progress value={totalProgress} className="h-1" />
      </div>
    </motion.div>
  );
}
