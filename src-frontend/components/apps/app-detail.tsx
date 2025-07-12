"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  Trash2,
  Terminal,
  FileText,
  BarChart3,
  Layers,
  Play,
  Square,
  RotateCcw,
  MoreHorizontal,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toolbar } from "@/components/ui/toolbar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  getApp,
  installApp,
  startApp,
  stopApp,
  uninstallApp,
  type App,
} from "@/lib/api/apps";
import { useConnectionStore, useBreadcrumbStore } from "@/stores";
import { AppFiles, AppInterface, AppLogs, AppStats } from "@/components/apps";
import { toast } from "@/hooks/use-toast";
import { AppBreadcrumb } from "./apps-breadcrumb";

interface AppDetailProps {
  appId: string;
  onBack: () => void;
}

export function AppDetail({ appId, onBack }: AppDetailProps) {
  const [app, setApp] = useState<App | null>(null);
  const [appUrl, setAppUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isReinstalling, setIsReinstalling] = useState(false);
  const [isUninstalling, setIsUninstalling] = useState(false);
  const [activeTab, setActiveTab] = useState("interface");
  const [tabKey, setTabKey] = useState(0); // Increment this to force remounting of tab content
  const {
    settings: { url: daemonUrl },
  } = useConnectionStore();
  const { setBreadcrumb, clearBreadcrumb } = useBreadcrumbStore();

  const { openPath } =
    typeof window !== "undefined" && typeof window.__TAURI__ !== "undefined"
      ? window.__TAURI__.opener
      : { openPath: (path: string) => window.open(path, "_blank") };

  const fetchApp = useCallback(async () => {
    setIsLoading(true);
    try {
      const app = await getApp(appId);
      setApp(app);
    } catch (error) {
      toast({
        icon: "❌",
        title: "Failed to load app",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    fetchApp();
  }, [fetchApp]);

  useEffect(() => {
    setBreadcrumb(<AppBreadcrumb app={app} />);
    return () => clearBreadcrumb();
  }, [setBreadcrumb, clearBreadcrumb, app]);

  // Update the appUrl state when the app is loaded
  useEffect(() => {
    if (daemonUrl && app && app.ports.length > 0) {
      const { protocol, hostname } = new URL(daemonUrl);
      const port = app.ports[0];
      setAppUrl(`${protocol}//${hostname}:${port}`);
    } else {
      setAppUrl("");
    }
  }, [app, daemonUrl]);

  const handleUninstall = async () => {
    if (!app) return;

    setIsUninstalling(true);
    const appName = app.info.id.split(".").pop();

    try {
      toast({
        icon: "🗑️",
        title: "Uninstalling...",
        description: `Uninstalling ${appName}...`,
      });

      await uninstallApp(app.info.id);

      toast({
        icon: "🗑️",
        title: "App uninstalled",
        description: `${appName} has been uninstalled.`,
      });

      onBack(); // Navigate back after successful uninstall
    } catch (error) {
      toast({
        icon: "❌",
        title: "Uninstall Failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUninstalling(false);
    }
  };

  const handleStart = async () => {
    try {
      setIsStarting(true);
      await startApp(appId);
      setTabKey((prev) => prev + 1); // Force remounting of tab content
    } catch (error) {
      toast({
        icon: "❌",
        title: "Failed to start app",
        description:
          (error instanceof Error ? error.message : "Unknown error occurred") +
          ". Please check the app's logs for more information.",
        variant: "destructive",
      });
    } finally {
      await fetchApp();
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    try {
      setIsStopping(true);
      await stopApp(appId);
    } catch (error) {
      toast({
        icon: "❌",
        title: "Failed to stop app",
        description:
          (error instanceof Error ? error.message : "Unknown error occurred") +
          ". Please check the app's logs for more information.",
        variant: "destructive",
      });
    } finally {
      await fetchApp();
      setIsStopping(false);
    }
  };

  const handleReinstall = async () => {
    // Early return if app data is not available
    if (!app) {
      return;
    }

    // Only git-based apps can be reinstalled
    if (app.info.source !== "git") {
      toast({
        icon: "❌",
        title: "Failed to reinstall app",
        description: `This is a ${app.info.source} app, only git apps can be reinstalled`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsReinstalling(true);

      // Stop the app if it's currently running to ensure clean reinstallation
      if (app.status === "running") {
        await stopApp(appId);
      }

      // Reinstall the app with force flag to overwrite existing files
      await installApp({
        repoURL: app.info.sourceURI,
        branch: app.info.branch,
        force: true, // Force overwrite existing installation
      });

      // Attempt to restart the app after successful reinstallation
      // We ignore restart errors as the user can manually start the app
      try {
        await startApp(appId);
      } catch (restartError) {
        console.warn(`Failed to auto-restart app ${appId}:`, restartError);
        // Don't throw here - reinstallation was successful, just restart failed
      }

      // Refresh app data after a short delay to allow for state updates
      setTimeout(async () => {
        await fetchApp();
        setIsReinstalling(false);
      }, 1000);

      // Show success message
      toast({
        icon: "✅",
        title: "App reinstalled",
        description: "App has been reinstalled successfully",
        variant: "default",
      });
    } catch (error) {
      console.error(`Failed to reinstall app ${appId}:`, error);

      // Show error message with helpful context
      toast({
        icon: "❌",
        title: "Failed to reinstall app",
        description:
          (error instanceof Error ? error.message : "Unknown error occurred") +
          ". Please check the app's logs for more information.",
        variant: "destructive",
      });
    } finally {
      // Always reset the reinstalling state, even if there was an error
      setIsReinstalling(false);
    }
  };

  const handleRestart = async () => {
    try {
      setIsRestarting(true);
      await stopApp(appId);
      await startApp(appId);
      setTabKey((prev) => prev + 1); // Force remounting of tab content
    } catch (error) {
      toast({
        icon: "❌",
        title: "Failed to restart app",
        description:
          (error instanceof Error ? error.message : "Unknown error occurred") +
          ". Please check the app's logs for more information.",
        variant: "destructive",
      });
    } finally {
      await fetchApp();
      setIsRestarting(false);
    }
  };

  const updateActiveTab = (tab: string) => {
    setActiveTab(tab);
    fetchApp();
  };

  if (!app && isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading app...</p>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 text-5xl">📦</div>
        <h3 className="mb-2 text-lg font-medium">App not found</h3>
        <p className="text-muted-foreground mb-4">
          The app you are looking for does not exist.
        </p>
        <Button onClick={onBack}>Go back</Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Toolbar
        title={app.info.name}
        icon={
          <ChevronLeft className="h-4 w-4 cursor-pointer" onClick={onBack} />
        }
        leftSection={
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "ml-2 h-2 w-2 rounded-full",
                app.status === "running"
                  ? "bg-green-500"
                  : app.status === "stopped"
                    ? "bg-red-500"
                    : "bg-yellow-500",
              )}
            />
            <span className="text-muted-foreground text-sm">
              {app.status === "running"
                ? "Running"
                : app.status === "stopped"
                  ? "Stopped"
                  : "Restarting..."}
            </span>
          </div>
        }
      >
        <div className="bg-muted/50 flex items-center gap-1 rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3"
            onClick={handleStart}
            disabled={
              app.status === "running" ||
              isLoading ||
              isRestarting ||
              isStarting
            }
          >
            <Play className="mr-1 h-4 w-4" />
            Start
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3"
            onClick={handleStop}
            disabled={
              app.status === "stopped" ||
              isLoading ||
              isRestarting ||
              isStopping
            }
          >
            <Square className="mr-1 h-4 w-4" />
            Stop
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3"
            onClick={handleRestart}
            disabled={
              app.status === "stopped" ||
              isLoading ||
              isRestarting ||
              isStopping
            }
          >
            <RotateCcw className="mr-1 h-4 w-4" />
            Restart
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleReinstall}
                disabled={isReinstalling}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                {isReinstalling ? "Reinstalling..." : "Reinstall"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-500 focus:text-red-500"
                onClick={handleUninstall}
                disabled={isUninstalling}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isUninstalling ? "Uninstalling..." : "Uninstall"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Toolbar>

      <Tabs
        value={activeTab}
        onValueChange={updateActiveTab}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <div className="bg-muted/40 border-b px-4">
          <TabsList className="h-12 bg-transparent">
            <TabsTrigger
              value="interface"
              className="data-[state=active]:bg-background"
            >
              <Layers className="mr-2 h-4 w-4" />
              Interface
            </TabsTrigger>
            <TabsTrigger
              value="logs"
              className="data-[state=active]:bg-background"
            >
              <Terminal className="mr-2 h-4 w-4" />
              Logs
            </TabsTrigger>
            <TabsTrigger
              value="files"
              className="data-[state=active]:bg-background"
            >
              <FileText className="mr-2 h-4 w-4" />
              Files
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="data-[state=active]:bg-background"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Stats
            </TabsTrigger>
          </TabsList>
        </div>

        {isRestarting ? (
          <div className="bg-muted/40 flex h-full items-center justify-center">
            <p className="text-muted-foreground">Restarting app...</p>
          </div>
        ) : isReinstalling ? (
          <div className="bg-muted/40 flex h-full items-center justify-center">
            <p className="text-muted-foreground">Reinstalling app...</p>
          </div>
        ) : isUninstalling ? (
          <div className="bg-muted/40 flex h-full items-center justify-center">
            <p className="text-muted-foreground">Uninstalling app...</p>
          </div>
        ) : (
          <div className="bg-muted/40 flex-1 overflow-auto px-4 py-2">
            <TabsContent
              key={`interface-${tabKey}`}
              value="interface"
              className="m-0 h-full data-[state=active]:flex-1"
            >
              <AppInterface
                app={app}
                appUrl={appUrl}
                appStatus={app.status}
                isLoading={isLoading}
                fetchApp={fetchApp}
                setActiveTab={updateActiveTab}
                handleStart={handleStart}
                openPath={openPath}
              />
            </TabsContent>

            <TabsContent
              key={`logs-${tabKey}`}
              value="logs"
              className="m-0 h-full data-[state=active]:flex-1"
            >
              <AppLogs appId={appId} />
            </TabsContent>

            <TabsContent
              key={`files-${tabKey}`}
              value="files"
              className="m-0 h-full data-[state=active]:flex-1"
            >
              <AppFiles appPath={app.info.path} />
            </TabsContent>

            <TabsContent
              key={`stats-${tabKey}`}
              value="stats"
              className="m-0 h-full data-[state=active]:flex-1"
            >
              <AppStats appId={appId} />
            </TabsContent>
          </div>
        )}
      </Tabs>
    </div>
  );
}
