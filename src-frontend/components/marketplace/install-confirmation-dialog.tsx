"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Download,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { MarketplaceApp } from "@/lib/api/marketplace";
import { installApp } from "@/lib/api/apps";
import { toast } from "@/hooks/use-toast";
import { useOpenPath } from "@/hooks/use-open-path";

interface InstallConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  app: MarketplaceApp;
  onConfirm: () => void;
  onCancel: () => void;
}

export function InstallConfirmationDialog({
  isOpen,
  onOpenChange,
  app,
  onConfirm,
  onCancel,
}: InstallConfirmationDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { openPath } = useOpenPath();
  const handleInstall = async () => {
    if (!app.repository) {
      toast({
        icon: "❌",
        title: "Installation Failed",
        description: "App repository URL is not available",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Show loading toast
      toast({
        icon: app.icon || "📦",
        title: "Installing app",
        description: `Installing ${app.name}...`,
      });

      // Install app using repository URL
      await installApp({
        repoURL: app.repository,
        branch: app.branch || "main",
        force: false,
      });

      // Success toast
      toast({
        icon: "🎉",
        title: "App Installed!",
        description: `${app.name} has been successfully installed.`,
        variant: "default",
      });

      onConfirm();
    } catch (error) {
      console.error("Failed to install app:", error);

      toast({
        icon: "❌",
        title: "Installation Failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm sm:max-w-md md:max-w-xl">
        <AlertDialogHeader className="gap-2">
          <div className="flex items-start">
            <AlertTriangle className="mr-2 flex-shrink-0 text-amber-500" />
            <AlertDialogTitle className="text-left">
              Do you trust the authors of this app?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 text-left md:ml-8">
            The app{" "}
            {app.repository ? (
              <button
                onClick={() => openPath(app.repository!)}
                className="m-0 inline-flex text-blue-600 hover:underline"
              >
                {app.name} <ExternalLink className="h-2 w-2 align-super" />
              </button>
            ) : (
              <span className="font-medium">{app.name}</span>
            )}
            is added by{" "}
            {app.website ? (
              <button
                onClick={() => openPath(app.website!)}
                className="m-0 inline-flex text-blue-600 hover:underline"
              >
                {app.author} <ExternalLink className="h-2 w-2 align-super" />
              </button>
            ) : (
              <span className="font-medium">{app.author}</span>
            )}
            .
            <span className="my-3 flex items-center gap-2 text-sm">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 p-1 dark:bg-slate-700">
                <ShieldAlert className="h-4 w-4 text-red-500" />
              </span>
              <span className="text-muted-foreground">
                SyftBox may automatically execute files from this app on
                installation.
              </span>
            </span>
            SyftBox has no control over the behavior of installed apps,
            including how they manage your personal data. Proceed only if you
            trust the author.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-between md:ml-8">
            {app.repository && (
              <Button
                variant="outline"
                onClick={() => openPath(app.repository!)}
              >
                View Source
              </Button>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
              <Button
                onClick={handleInstall}
                disabled={isProcessing}
                className="bg-primary hover:bg-primary/90"
              >
                <Download className="mr-2 h-4 w-4" />
                {isProcessing ? "Installing..." : "Trust & Install"}
              </Button>
            </div>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
