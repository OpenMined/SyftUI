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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toolbar } from "@/components/ui/toolbar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getApp, startApp, stopApp, type App } from "@/lib/api/apps";
import { useConnectionStore } from "@/stores";
import { AppFiles, AppInterface, AppLogs, AppStats } from "@/components/apps";
import { toast } from "@/hooks/use-toast";

interface AppDetailProps {
  appId: string;
  onUninstall: () => Promise<boolean>;
  onBack: () => void;
}

export function AppDetail({ appId, onUninstall, onBack }: AppDetailProps) {
  const [app, setApp] = useState<App | null>(null);
  const [appUrl, setAppUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isUninstalling, setIsUninstalling] = useState(false);
  const [activeTab, setActiveTab] = useState("interface");
  const {
    settings: { url: daemonUrl },
  } = useConnectionStore();

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
    setIsUninstalling(true);
    const uninstalled = await onUninstall();
    if (uninstalled) {
      onBack();
    }
    setIsUninstalling(false);
  };

  const handleStart = async () => {
    try {
      setIsStarting(true);
      await startApp(appId);
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

  const handleRestart = async () => {
    try {
      setIsRestarting(true);
      await stopApp(appId);
      await startApp(appId);
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
        <div className="flex items-center">
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              className="rounded-r-none border-r-0"
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
              variant="outline"
              size="sm"
              className="rounded-none border-x-0"
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
              variant="outline"
              size="sm"
              className="rounded-l-none border-l-0"
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
          </div>

          <Separator orientation="vertical" className="mx-2 h-6" />

          <Button
            variant="destructive"
            size="sm"
            onClick={handleUninstall}
            disabled={isUninstalling}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            {isUninstalling ? "Uninstalling..." : "Uninstall"}
          </Button>
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
        ) : (
          <div className="bg-muted/40 flex-1 overflow-auto px-4 py-2">
            <TabsContent
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
              value="logs"
              className="m-0 h-full data-[state=active]:flex-1"
            >
              <AppLogs appId={appId} />
            </TabsContent>

            <TabsContent
              value="files"
              className="m-0 h-full data-[state=active]:flex-1"
            >
              <AppFiles appPath={app.info.path} />
            </TabsContent>

            <TabsContent
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
