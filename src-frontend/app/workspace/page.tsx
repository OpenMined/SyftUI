"use client";

import { useEffect, Suspense } from "react";
import { useQueryState } from "nuqs";
import { FileManager } from "@/components/workspace/file-manager";
import {
  initializeFileSystemStore,
  useFileSystemStore,
} from "@/stores/useFileSystemStore";

function FilesPageContent() {
  const [initialPath] = useQueryState("path");
  const { refreshFileSystem } = useFileSystemStore();

  useEffect(() => {
    initializeFileSystemStore(initialPath);
  }, [initialPath]);

  useEffect(() => {
    // Periodically refresh the file system
    const interval = setInterval(() => {
      refreshFileSystem();
    }, 3000);
    return () => clearInterval(interval);
  }, [refreshFileSystem]);

  return (
    <div
      className="flex h-full"
      onMouseDown={(e) => {
        if (e.detail > 1) {
          // Prevent double click from selecting text
          // We use double clicks for file system navigation, so we want to prevent the default
          // behavior of selecting text. Using `user-select: none` in CSS would prevent text
          // selection altogether, which is not what we want.
          e.preventDefault();
        }
      }}
    >
      <FileManager />
    </div>
  );
}

export default function FilesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FilesPageContent />
    </Suspense>
  );
}
