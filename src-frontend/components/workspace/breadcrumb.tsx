"use client";

import type React from "react";

import { useState } from "react";
import { useFileSystemStore } from "@/stores/useFileSystemStore";
import { ChevronRight, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

export function Breadcrumb() {
  const { currentPath, navigateTo, moveItems } = useFileSystemStore();
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const handleNavigate = (index: number) => {
    const newPath = currentPath.slice(0, index);
    navigateTo(newPath);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTargetIndex(index);
  };

  const handleDragLeave = () => {
    setDropTargetIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDropTargetIndex(null);

    const data = e.dataTransfer.getData("application/json");
    if (data) {
      try {
        const item = JSON.parse(data);
        // Move the item to this path
        const targetPath = index === 0 ? [] : currentPath.slice(0, index);
        moveItems([item.id], targetPath);
      } catch (err) {
        console.error("Failed to parse drag data", err);
      }
    }
  };

  return (
    <div className="border-border flex items-center border-b px-4 py-2">
      <button
        onClick={() => navigateTo([])}
        className={cn(
          "hover:bg-accent hover:text-accent-foreground rounded-md p-1",
          dropTargetIndex === 0 && "bg-accent",
        )}
        onDragOver={(e) => handleDragOver(e, 0)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, 0)}
      >
        <Briefcase className="h-4 w-4" />
      </button>

      {currentPath.length > 0 && (
        <ChevronRight className="text-muted-foreground mx-1 h-4 w-4" />
      )}

      {currentPath.map((segment, index) => (
        <div key={index} className="flex items-center">
          <button
            onClick={() => handleNavigate(index + 1)}
            className={cn(
              "rounded px-1 py-0.5 text-sm hover:underline",
              dropTargetIndex === index + 1 && "bg-accent",
            )}
            onDragOver={(e) => handleDragOver(e, index + 1)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index + 1)}
          >
            {segment}
          </button>
          {index < currentPath.length - 1 && (
            <ChevronRight className="text-muted-foreground mx-1 h-4 w-4" />
          )}
        </div>
      ))}
    </div>
  );
}
