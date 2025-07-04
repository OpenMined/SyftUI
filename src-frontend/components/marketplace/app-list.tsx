"use client";

import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { App } from "@/lib/apps-data";
import { AppCard } from "./app-card";

interface AppListProps {
  apps: App[];
  onSelectApp: (appId: string) => void;
  onActionClick?: (appId: string) => void;
  searchQuery?: string;
  viewContext: "marketplace" | "apps";
}

export function AppList({
  apps,
  onSelectApp,
  onActionClick,
  searchQuery = "",
  viewContext,
}: AppListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);

  // Filter apps based on search query
  const filteredApps = apps.filter(
    (app) =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  useEffect(() => {
    const calculateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const availableHeight = window.innerHeight - rect.top;
        setContainerHeight(availableHeight);
      }
    };

    calculateHeight();
    window.addEventListener("resize", calculateHeight);

    return () => {
      window.removeEventListener("resize", calculateHeight);
    };
  }, []);

  return (
    <ScrollArea
      ref={containerRef}
      style={{
        height: containerHeight ? `${containerHeight}px` : "100%",
        overflowY: "auto",
      }}
    >
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredApps.length > 0 ? (
          filteredApps.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              onClick={onSelectApp}
              onActionClick={onActionClick}
              viewContext={viewContext}
            />
          ))
        ) : (
          <div className="text-muted-foreground col-span-full flex h-40 items-center justify-center">
            No apps found matching your search
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
