"use client";

import { useEffect } from "react";
import { useQueryState } from "nuqs";
import { FileManager } from "@/components/workspace/file-manager";
import { initializeFileSystemStore } from "@/stores/useFileSystemStore";

export default function FilesPage() {
  const [initialPath] = useQueryState("path");

  useEffect(() => {
    initializeFileSystemStore(initialPath?.split("/") || []);
  }, [initialPath]);

  return (
    <div className="bg-background flex h-screen">
      <FileManager />
    </div>
  );
}
