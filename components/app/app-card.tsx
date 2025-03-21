"use client"

import { motion } from "framer-motion"
import { Star, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { App } from "@/lib/mock-apps"

interface AppCardProps {
  app: App
  onClick: (appId: string) => void
  onActionClick?: (appId: string) => void
  viewContext: 'marketplace' | 'apps'
}

export function AppCard({ app, onClick, onActionClick, viewContext }: AppCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="border rounded-lg overflow-hidden flex flex-col cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all"
      onClick={() => onClick(app.id)}
    >
      <div className="p-4 flex items-start gap-3">
        <div className="text-3xl">{app.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{app.name}</h3>
            {app.verified && (
              <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                Verified
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">by {app.author}</p>
        </div>
      </div>

      <div className="px-4 pb-2 flex-1">
        <p className="text-sm line-clamp-2">{app.description}</p>
      </div>

      <div className="px-4 py-2 flex items-center text-sm text-muted-foreground">
        {app.installed && app.lastUsed ? (
          <div className="flex items-center mr-4">Last used: {app.lastUsed}</div>
        ) : (
          <>
            <div className="flex items-center mr-4">
              <Star className="h-4 w-4 mr-1 text-yellow-500" />
              {app.stars}
            </div>
            <div className="flex items-center">
              <Download className="h-4 w-4 mr-1" />
              {app.downloads.toLocaleString()}
            </div>
          </>
        )}
        <div className="ml-auto">
          {viewContext === 'marketplace' ? (
            <div className="flex items-center gap-2">
              {app.installed && (
                <span className="text-xs text-muted-foreground">Installed</span>
              )}
              <Button
                variant="outline"
                size="sm"
                className={app.installed ? "hover:border-red-500 hover:text-red-500 transition-colors" : ""}
                onClick={(e) => {
                  e.stopPropagation()
                  if (onActionClick) onActionClick(app.id)
                }}
              >
                {app.installed ? "Uninstall" : "Install"}
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="px-4 py-2 border-t flex flex-wrap gap-1">
        {app.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>
    </motion.div>
  )
}