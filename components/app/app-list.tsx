"use client"

import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { App } from "@/lib/mock-apps"
import { AppCard } from "./app-card"

interface AppListProps {
  apps: App[]
  onSelectApp: (appId: string) => void
  onActionClick?: (appId: string) => void
  searchQuery?: string
  viewContext: 'marketplace' | 'apps'
}

export function AppList({ apps, onSelectApp, onActionClick, searchQuery = "", viewContext }: AppListProps) {
  // Filter apps based on search query
  const filteredApps = apps.filter(
    (app) =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <ScrollArea className="h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
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
          <div className="col-span-full flex items-center justify-center h-40 text-muted-foreground">
            No apps found matching your search
          </div>
        )}
      </div>
    </ScrollArea>
  )
}