import { ExternalLink, Play, RefreshCcw, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { App } from "@/lib/api/apps";

interface AppInterfaceProps {
  app: App;
  appUrl: string;
  appStatus: "running" | "stopped" | "restarting";
  isLoading: boolean;
  fetchApp: () => void;
  setActiveTab: (tab: string) => void;
  handleStart: () => void;
  openPath: (path: string) => void;
}

export function AppInterface({
  app,
  appUrl,
  appStatus,
  isLoading,
  fetchApp,
  setActiveTab,
  handleStart,
  openPath,
}: AppInterfaceProps) {
  useEffect(() => {
    // Auto-refresh every 5 seconds when app is running but has no URL yet
    if (appStatus === "running" && !appUrl) {
      const interval = setInterval(() => {
        fetchApp();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [appStatus, appUrl, fetchApp]);

  return (
    <>
      {appStatus === "running" && appUrl ? (
        <div className="flex h-full w-full flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="px-2 text-sm font-medium">App Interface</span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchApp}
                disabled={isLoading}
              >
                <RefreshCcw className="mr-1 h-4 w-4" />
                Refresh
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openPath(appUrl)}
              >
                <ExternalLink className="mr-1 h-4 w-4" />
                Open in new tab
              </Button>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="bg-background flex h-full w-full items-center justify-center">
              <iframe
                title={`${app.name}`}
                className="h-full w-full rounded-lg border"
                src={appUrl}
                sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-downloads"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-full items-center justify-center">
          {appStatus === "stopped" ? (
            <div className="text-center">
              <p className="text-muted-foreground">
                The app is currently stopped. Start the app to view its
                interface.
              </p>
              <Button className="mt-4" onClick={handleStart}>
                <Play className="mr-2 h-4 w-4" />
                Start App
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-muted-foreground">
                The app may not have a web interface, or it is still starting
                up. Please try again in a few seconds.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Button variant="ghost" onClick={fetchApp} disabled={isLoading}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <div className="border-l"></div>
                <Button variant="ghost" onClick={() => setActiveTab("logs")}>
                  <Terminal className="mr-2 h-4 w-4" />
                  View Logs
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
