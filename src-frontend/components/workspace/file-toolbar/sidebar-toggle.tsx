"use client";

import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFileSystemStore } from "@/stores/useFileSystemStore";

export function SidebarToggle() {
  const { detailsSidebarOpen, toggleDetailsSidebar } = useFileSystemStore();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2"
      onClick={toggleDetailsSidebar}
      aria-label={
        detailsSidebarOpen ? "Hide details sidebar" : "Show details sidebar"
      }
    >
      <div className="flex items-center gap-2">
        {detailsSidebarOpen ? (
          <PanelRightClose className="h-4 w-4" />
        ) : (
          <PanelRightOpen className="h-4 w-4" />
        )}
        <span>Details</span>
      </div>
    </Button>
  );
}
