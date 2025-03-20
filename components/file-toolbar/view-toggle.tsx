"use client"

import { Grid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFileSystem } from "@/components/contexts/file-system-context"

export function ViewToggle() {
  const { viewMode, setViewMode } = useFileSystem()

  return (
    <div className="flex border rounded-md overflow-hidden">
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
  )
}
