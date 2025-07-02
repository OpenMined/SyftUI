"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Star, Download, Settings, Power, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { App } from "@/lib/apps-data";
import { InstallConfirmationDialog } from "./install-confirmation-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

interface AppCardProps {
  app: App;
  onClick: (appId: string) => void;
  onActionClick?: (appId: string) => void;
  viewContext: "marketplace" | "apps";
}

export function AppCard({
  app,
  onClick,
  onActionClick,
  viewContext,
}: AppCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInstalled, setIsInstalled] = useState(app.installed);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(app.autoUpdate !== false); // Default to true if not specified
  const [isEnabled, setIsEnabled] = useState(app.enabled !== false); // Default to true if not specified
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`hover:border-primary/50 flex cursor-pointer flex-col overflow-hidden rounded-lg border transition-all hover:shadow-xs ${isInstalled && !isEnabled ? "opacity-60" : ""}`}
        onClick={() => {
          // Only navigate to app details if the app is enabled or in marketplace view
          if (viewContext === "marketplace" || isEnabled || !isInstalled) {
            onClick(app.id);
          }
        }}
      >
        <div className="flex items-start gap-3 p-4">
          <div className="text-3xl">{app.icon}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-medium">{app.name}</h3>
              {app.verified ? (
                <Badge
                  variant="outline"
                  className="border-blue-200 bg-blue-50 text-blue-600"
                >
                  Verified
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-gray-200 bg-gray-50 text-gray-600"
                >
                  Unverified
                </Badge>
              )}
              {isInstalled && !isEnabled && (
                <Badge
                  variant="outline"
                  className="border-yellow-200 bg-yellow-50 text-yellow-600"
                >
                  Disabled
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">by {app.author}</p>
          </div>
        </div>

        <div className="flex-1 px-4 pb-2">
          <p className="line-clamp-2 text-sm">{app.description}</p>
        </div>

        <div className="text-muted-foreground flex items-center px-4 py-2 text-sm">
          {isInstalled && app.lastUsed ? (
            <div className="mr-4 flex items-center">
              Last used: {app.lastUsed}
            </div>
          ) : (
            <>
              <div className="mr-4 flex items-center">
                <Star className="mr-1 h-4 w-4 text-yellow-500" />
                {app.stars}
              </div>
              <div className="flex items-center">
                <Download className="mr-1 h-4 w-4" />
                {app.downloads.toLocaleString()}
              </div>
            </>
          )}
          <div className="ml-auto flex items-center gap-2">
            {viewContext === "marketplace" ? (
              <div className="flex items-center gap-2">
                {isInstalled && (
                  <span className="text-muted-foreground text-xs">
                    Installed
                  </span>
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
                    if (isInstalled || app.verified) {
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
            ) : (
              isInstalled && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Settings className="h-4 w-4" />
                      <span className="sr-only">Settings</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuCheckboxItem
                      checked={autoUpdate}
                      onClick={(e) => e.stopPropagation()}
                      onCheckedChange={(checked) => {
                        setAutoUpdate(checked);
                        // Update the app's metadata (for demonstration purposes)
                        app.autoUpdate = checked;
                        toast({
                          icon: "🔄",
                          title: checked
                            ? "Auto updates enabled"
                            : "Auto updates disabled",
                          description: `${app.name} will ${checked ? "now" : "no longer"} update automatically.`,
                        });
                      }}
                    >
                      Auto updates
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        const newEnabledState = !isEnabled;
                        setIsEnabled(newEnabledState);
                        // Update the app's metadata (for demonstration purposes)
                        app.enabled = newEnabledState;
                        toast({
                          icon: "🔌",
                          title: isEnabled ? "App disabled" : "App enabled",
                          description: `${app.name} has been ${isEnabled ? "disabled" : "enabled"}.`,
                        });
                      }}
                    >
                      <Power className="h-4 w-4" />
                      {isEnabled ? "Disable app" : "Enable app"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-500 focus:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onActionClick) {
                          setIsProcessing(true);
                          toast({
                            icon: "🗑️",
                            title: "Uninstalling...",
                            description: `Uninstalling ${app.name}...`,
                          });
                          // Simulate uninstallation process
                          setTimeout(() => {
                            setIsInstalled(false);
                            setIsProcessing(false);
                            toast({
                              icon: "🗑️",
                              title: "App uninstalled",
                              description: `${app.name} has been uninstalled.`,
                            });
                            onActionClick(app.id);
                          }, 2000);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Uninstall
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            )}
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
