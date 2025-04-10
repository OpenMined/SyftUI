"use client";

import { Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFileSystemStore } from "@/stores/useFileSystemStore";

export function ViewToggle() {
  const { viewMode, setViewMode } = useFileSystemStore();

  return (
    <div className="flex overflow-hidden rounded-md border">
      <Button
        variant={viewMode === "grid" ? "default" : "ghost"}
        size="sm"
        className="rounded-none"
        onClick={() => setViewMode("grid")}
      >
        <Grid className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === "list" ? "default" : "ghost"}
        size="sm"
        className="rounded-none"
        onClick={() => setViewMode("list")}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
}
