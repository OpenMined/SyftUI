"use client";

import { useEffect } from "react";
import { useQueryState } from "nuqs";
import { FileManager } from "@/components/workspace/file-manager";
import {
  initializeFileSystemStore,
  useFileSystemStore,
} from "@/stores/useFileSystemStore";

export default function FilesPage() {
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
    <div className="bg-background flex h-screen">
      <FileManager />
    </div>
  );
}
