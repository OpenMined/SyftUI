"use client";

import { MarketplaceApp } from "@/lib/api/marketplace";
import { AppCard } from "./app-card";

interface AppListProps {
  apps: MarketplaceApp[];
  onSelectApp: (appId: string) => void;
  onActionClick?: (appId: string) => void;
  searchQuery?: string;
}

export function AppList({
  apps,
  onSelectApp,
  onActionClick,
  searchQuery = "",
}: AppListProps) {
  // Filter apps based on search query
  const filteredApps = apps.filter(
    (app) =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full flex-1 overflow-auto px-4 py-2">
        {filteredApps.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredApps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                onClick={onSelectApp}
                onActionClick={onActionClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground flex h-40 items-center justify-center">
            No apps found matching your search
          </div>
        )}
      </div>
    </div>
  );
}
