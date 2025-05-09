"use client";

import { useState } from "react";
import {
  ChevronLeft,
  Play,
  Square,
  RotateCcw,
  Trash2,
  Terminal,
  FileText,
  BarChart3,
  Layers,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toolbar } from "@/components/ui/toolbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { type App } from "@/lib/api/apps";

interface AppDetailProps {
  app?: App;
  isLoading: boolean;
  onUninstall: () => Promise<boolean>;
  onBack: () => void;
}

export function AppDetail({
  app,
  isLoading,
  onUninstall,
  onBack,
}: AppDetailProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [appStatus, setAppStatus] = useState<
    "running" | "stopped" | "restarting"
  >("running");
  const [activeTab, setActiveTab] = useState("interface");

  // Mock data for stats
  const stats = {
    cpu: 23,
    memory: 45,
    disk: {
      read: "2.3 MB/s",
      write: "0.8 MB/s",
    },
    network: {
      in: "1.2 MB/s",
      out: "0.5 MB/s",
    },
  };

  // Mock logs
  const logs = [
    {
      timestamp: "2025-05-09 18:42:12",
      level: "INFO",
      message: "Application started successfully",
    },
    {
      timestamp: "2025-05-09 18:42:13",
      level: "INFO",
      message: "Connected to database",
    },
    {
      timestamp: "2025-05-09 18:42:15",
      level: "DEBUG",
      message: "Processing request #1242",
    },
    {
      timestamp: "2025-05-09 18:42:18",
      level: "WARN",
      message: "Slow query detected (324ms)",
    },
    {
      timestamp: "2025-05-09 18:42:20",
      level: "INFO",
      message: "Request completed successfully",
    },
    {
      timestamp: "2025-05-09 18:43:01",
      level: "ERROR",
      message: "Failed to connect to external API: timeout",
    },
    {
      timestamp: "2025-05-09 18:43:05",
      level: "INFO",
      message: "Retrying connection...",
    },
    {
      timestamp: "2025-05-09 18:43:08",
      level: "INFO",
      message: "Connection established",
    },
    {
      timestamp: "2025-05-09 18:44:12",
      level: "DEBUG",
      message: "Cache hit ratio: 78%",
    },
    {
      timestamp: "2025-05-09 18:45:22",
      level: "INFO",
      message: "Scheduled maintenance task running",
    },
    {
      timestamp: "2025-05-09 18:46:30",
      level: "DEBUG",
      message: "Memory usage optimized",
    },
    {
      timestamp: "2025-05-09 18:47:45",
      level: "INFO",
      message: "New client connection from 192.168.1.105",
    },
  ];

  // Mock files
  const files = [
    {
      name: "index.js",
      type: "file",
      size: "12.4 KB",
      modified: "2025-05-08 14:23",
    },
    {
      name: "package.json",
      type: "file",
      size: "2.1 KB",
      modified: "2025-05-08 14:20",
    },
    { name: "src", type: "directory", items: 8, modified: "2025-05-08 14:22" },
    {
      name: "public",
      type: "directory",
      items: 4,
      modified: "2025-05-08 14:21",
    },
    {
      name: "README.md",
      type: "file",
      size: "4.5 KB",
      modified: "2025-05-08 14:19",
    },
    {
      name: ".env",
      type: "file",
      size: "0.3 KB",
      modified: "2025-05-08 14:18",
    },
    {
      name: "node_modules",
      type: "directory",
      items: 1243,
      modified: "2025-05-08 14:25",
    },
    {
      name: ".gitignore",
      type: "file",
      size: "0.5 KB",
      modified: "2025-05-08 14:17",
    },
  ];

  const handleUninstall = async () => {
    setIsProcessing(true);
    const uninstalled = await onUninstall();
    if (uninstalled) {
      onBack();
    }
    setIsProcessing(false);
  };

  const handleStart = () => {
    setAppStatus("running");
  };

  const handleStop = () => {
    setAppStatus("stopped");
  };

  const handleRestart = () => {
    setAppStatus("restarting");
    setTimeout(() => {
      setAppStatus("running");
    }, 2000);
  };

  if (isLoading) {
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
        title={app.name}
        icon={
          <ChevronLeft className="h-4 w-4 cursor-pointer" onClick={onBack} />
        }
        leftSection={
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "ml-2 h-2 w-2 rounded-full",
                appStatus === "running"
                  ? "bg-green-500"
                  : appStatus === "stopped"
                    ? "bg-red-500"
                    : "bg-yellow-500",
              )}
            />
            <span className="text-muted-foreground text-sm">
              {appStatus === "running"
                ? "Running"
                : appStatus === "stopped"
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
              disabled={appStatus === "running" || appStatus === "restarting"}
            >
              <Play className="mr-1 h-4 w-4" />
              Start
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-none border-x-0"
              onClick={handleStop}
              disabled={appStatus === "stopped" || appStatus === "restarting"}
            >
              <Square className="mr-1 h-4 w-4" />
              Stop
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-l-none border-l-0"
              onClick={handleRestart}
              disabled={appStatus === "restarting"}
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
            disabled={isProcessing}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            {isProcessing ? "Uninstalling..." : "Uninstall"}
          </Button>
        </div>
      </Toolbar>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
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

        <div className="bg-muted/40 flex-1 overflow-hidden px-4 py-2">
          <TabsContent
            value="interface"
            className="m-0 h-full data-[state=active]:flex-1"
          >
            {appStatus === "running" ? (
              <div className="flex h-full w-full flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 text-sm font-medium">
                    App Interface
                  </span>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="mr-1 h-4 w-4" />
                    Open in new tab
                  </Button>
                </div>
                <div className="flex flex-1 items-center justify-center">
                  <div className="bg-background flex h-full w-full items-center justify-center rounded-lg border">
                    <div className="text-center">
                      <p className="text-muted-foreground">
                        App interface would be displayed here in an iframe
                      </p>
                      <p className="text-muted-foreground mt-2 text-sm">
                        URL: http://localhost:3000/{app.name.toLowerCase()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    App is currently {appStatus}. Start the app to view its
                    interface.
                  </p>
                  <Button className="mt-4" onClick={handleStart}>
                    <Play className="mr-2 h-4 w-4" />
                    Start App
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="logs"
            className="m-0 h-full data-[state=active]:flex-1"
          >
            <div className="flex h-full flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="px-2 text-sm font-medium">
                  Application Logs
                </span>
                <Button variant="outline" size="sm">
                  Clear Logs
                </Button>
              </div>
              <ScrollArea className="bg-background flex-1 rounded-lg border p-4 font-mono text-sm">
                {logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    <span className="text-muted-foreground">
                      {log.timestamp}
                    </span>{" "}
                    <span
                      className={cn(
                        log.level === "ERROR"
                          ? "text-red-400"
                          : log.level === "WARN"
                            ? "text-yellow-400"
                            : log.level === "DEBUG"
                              ? "text-blue-400"
                              : "text-green-400",
                      )}
                    >
                      [{log.level}]
                    </span>{" "}
                    <span>{log.message}</span>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent
            value="files"
            className="m-0 h-full data-[state=active]:flex-1"
          >
            <div className="flex h-full flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="px-2 text-sm font-medium">App Files</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Upload
                  </Button>
                  <Button variant="outline" size="sm">
                    New File
                  </Button>
                </div>
              </div>
              <div className="flex-1">
                <div className="bg-background overflow-hidden rounded-lg border">
                  <table className="w-full">
                    <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Name</th>
                        <th className="px-4 py-3 text-left">Type</th>
                        <th className="px-4 py-3 text-left">Size</th>
                        <th className="px-4 py-3 text-left">Modified</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {files.map((file, index) => (
                        <tr key={index} className="hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              {file.type === "directory" ? (
                                <Layers className="mr-2 h-4 w-4 text-blue-500" />
                              ) : (
                                <FileText className="mr-2 h-4 w-4 text-gray-500" />
                              )}
                              <span>{file.name}</span>
                            </div>
                          </td>
                          <td className="text-muted-foreground px-4 py-3">
                            {file.type === "directory" ? "Directory" : "File"}
                          </td>
                          <td className="text-muted-foreground px-4 py-3">
                            {file.type === "directory"
                              ? `${file.items} items`
                              : file.size}
                          </td>
                          <td className="text-muted-foreground px-4 py-3">
                            {file.modified}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="stats"
            className="m-0 h-full data-[state=active]:flex-1"
          >
            <div className="flex h-full flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="px-2 text-sm font-medium">Resource Usage</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">
                    Auto-refresh:
                  </span>
                  <Button variant="outline" size="sm">
                    5s
                  </Button>
                </div>
              </div>
              <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">CPU Usage</CardTitle>
                    <CardDescription>
                      Current processor utilization
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-2xl font-bold">{stats.cpu}%</span>
                      <span className="text-muted-foreground text-xs">
                        1 core
                      </span>
                    </div>
                    <Progress value={stats.cpu} className="h-2" />
                    <div className="text-muted-foreground mt-4 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="font-medium">User</div>
                        <div>18%</div>
                      </div>
                      <div>
                        <div className="font-medium">System</div>
                        <div>5%</div>
                      </div>
                      <div>
                        <div className="font-medium">Idle</div>
                        <div>77%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Memory Usage</CardTitle>
                    <CardDescription>RAM allocation and usage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {stats.memory}%
                      </span>
                      <span className="text-muted-foreground text-xs">
                        128 MB / 256 MB
                      </span>
                    </div>
                    <Progress value={stats.memory} className="h-2" />
                    <div className="text-muted-foreground mt-4 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="font-medium">Used</div>
                        <div>128 MB</div>
                      </div>
                      <div>
                        <div className="font-medium">Cached</div>
                        <div>32 MB</div>
                      </div>
                      <div>
                        <div className="font-medium">Available</div>
                        <div>96 MB</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Disk I/O</CardTitle>
                    <CardDescription>
                      Storage read/write operations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="mb-1 text-sm font-medium">Read</div>
                        <div className="text-2xl font-bold">
                          {stats.disk.read}
                        </div>
                        <div className="text-muted-foreground mt-1 text-xs">
                          Total: 1.2 GB
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 text-sm font-medium">Write</div>
                        <div className="text-2xl font-bold">
                          {stats.disk.write}
                        </div>
                        <div className="text-muted-foreground mt-1 text-xs">
                          Total: 0.4 GB
                        </div>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="text-sm">
                      <div className="mb-1 flex justify-between">
                        <span className="text-muted-foreground">
                          Disk Usage
                        </span>
                        <span>234 MB / 1 GB</span>
                      </div>
                      <Progress value={23.4} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Network I/O</CardTitle>
                    <CardDescription>Data transfer statistics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="mb-1 text-sm font-medium">Inbound</div>
                        <div className="text-2xl font-bold">
                          {stats.network.in}
                        </div>
                        <div className="text-muted-foreground mt-1 text-xs">
                          Total: 2.8 GB
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 text-sm font-medium">Outbound</div>
                        <div className="text-2xl font-bold">
                          {stats.network.out}
                        </div>
                        <div className="text-muted-foreground mt-1 text-xs">
                          Total: 1.5 GB
                        </div>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="text-sm">
                      <div className="mb-1 flex justify-between">
                        <span className="text-muted-foreground">
                          Connections
                        </span>
                        <span>12 active</span>
                      </div>
                      <div className="text-muted-foreground mt-2 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="font-medium">HTTP</div>
                          <div>8</div>
                        </div>
                        <div>
                          <div className="font-medium">WebSocket</div>
                          <div>3</div>
                        </div>
                        <div>
                          <div className="font-medium">Other</div>
                          <div>1</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
