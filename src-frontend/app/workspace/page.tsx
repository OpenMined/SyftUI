"use client";

import { useEffect } from "react";
import { useQueryState } from "nuqs";
import { FileManager } from "@/components/workspace/file-manager";
import { initializeFileSystemStore } from "@/stores/useFileSystemStore";

export default function FilesPage() {
  const [initialPath] = useQueryState("path");

  useEffect(() => {
    initializeFileSystemStore(initialPath);

    // Periodically update the file system
    const interval = setInterval(() => {
      initializeFileSystemStore(initialPath);
    }, 3000);
    return () => clearInterval(interval);
  }, [initialPath]);

  return (
    <div className="bg-background flex h-screen">
      <FileManager />
    </div>
  );
}
