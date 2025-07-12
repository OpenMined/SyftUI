"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarketplaceApp } from "@/lib/api/marketplace";
import { InstallConfirmationDialog } from "./install-confirmation-dialog";

interface AppCardProps {
  app: MarketplaceApp;
  onClick: (appId: string) => void;
  onActionClick?: (appId: string) => void;
}

export function AppCard({ app, onClick, onActionClick }: AppCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInstalled, setIsInstalled] = useState(app.installed);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`hover:border-primary/50 flex cursor-pointer flex-col overflow-hidden rounded-lg border transition-all hover:shadow-xs`}
        onClick={() => {
          onClick(app.id);
        }}
      >
        <div className="flex items-start gap-3 p-4">
          <div className="text-3xl">{app.icon}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-medium">{app.name}</h3>
            </div>
            <p className="text-muted-foreground text-sm">by {app.author}</p>
          </div>
        </div>

        <div className="flex-1 px-4 pb-2">
          <p className="line-clamp-2 text-sm">{app.description}</p>
        </div>

        <div className="text-muted-foreground flex items-center px-4 py-2 text-sm">
          <div className="mr-4 flex items-center">
            <Star className="mr-1 h-4 w-4 text-yellow-500" />
            {app.stars}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-2">
              {isInstalled && (
                <span className="text-muted-foreground text-xs">Installed</span>
              )}
              <Button
                variant="outline"
                size="sm"
                className={
                  isInstalled
                    ? "transition-colors hover:border-red-500 hover:text-red-500"
                    : ""
                }
                disabled={isProcessing}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isInstalled) {
                    if (onActionClick) {
                      setIsProcessing(true);
                      // Simulate installation/uninstallation process
                      setTimeout(() => {
                        setIsInstalled(!isInstalled);
                        setIsProcessing(false);
                        onActionClick(app.id);
                      }, 2000);
                    }
                  } else {
                    // Show install confirmation dialog
                    setShowInstallDialog(true);
                  }
                }}
              >
                {isProcessing
                  ? isInstalled
                    ? "Uninstalling..."
                    : "Installing..."
                  : isInstalled
                    ? "Uninstall"
                    : "Install"}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 border-t px-4 py-2">
          {app.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </motion.div>

      {/* Install Confirmation Dialog */}
      <InstallConfirmationDialog
        isOpen={showInstallDialog}
        onOpenChange={setShowInstallDialog}
        app={app}
        onConfirm={() => {
          setIsInstalled(!isInstalled);
          if (onActionClick) {
            onActionClick(app.id);
          }
          setShowInstallDialog(false);
        }}
        onCancel={() => {
          setShowInstallDialog(false);
        }}
      />
    </>
  );
}
