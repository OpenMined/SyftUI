import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getApp } from "@/lib/api/apps";
import type { App, ProcessStats, ConnectionStat } from "@/lib/api/apps";
import { cn } from "@/lib/utils";

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // For bytes and KB, show 0 decimals
  // For MB, show 1 decimal
  // For GB and TB, show 2 decimals
  const decimals = i <= 1 ? 0 : i === 2 ? 1 : 2;

  return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${units[i]}`;
};

const formatPercent = (value: number): string => {
  // Calculate appropriate decimal places based on the magnitude of the value
  // Using -log10(value) gives us the number of leading zeros after the decimal point
  // Examples:
  // 100%    → -log10(100) = -2  → 0 decimals  → "100%"
  // 10%     → -log10(10)  = -1  → 1 decimal   → "10.0%"
  // 1%      → -log10(1)   = 0   → 2 decimals  → "1.00%"
  // 0.1%    → -log10(0.1) = 1   → 3 decimals  → "0.100%"
  // 0.01%   → -log10(0.01)= 2   → 4 decimals  → "0.0100%"
  // 0.001%  → -log10(0.001)=3   → 5 decimals  → "0.00100%"
  // etc...
  const decimals = value > 0 ? Math.max(0, Math.ceil(-Math.log10(value))) : 0;

  // Limit precision to 20 decimal places to maintain readability
  // This prevents extremely small values from producing unreadable strings
  // while still preserving meaningful precision for most practical use cases
  const cappedDecimals = Math.min(decimals, 20);

  return `${value.toFixed(cappedDecimals)}%`;
};

function formatFamily(family: number): string {
  switch (family) {
    case 2:
      return "IPv4";
    case 10:
      return "IPv6";
    default:
      return String(family);
  }
}

function formatType(type: number): string {
  switch (type) {
    case 1:
      return "TCP";
    case 2:
      return "UDP";
    default:
      return String(type);
  }
}

const flattenObjectProperty = <T extends object>(
  obj: T,
  property: string,
  childrenKey: keyof T,
): Array<unknown> => {
  const getNestedValue = (obj: object, path: string): unknown => {
    return path
      .split(".")
      .reduce((acc, part) => acc?.[part as keyof typeof acc], obj);
  };

  const value = getNestedValue(obj, property);
  const result: Array<unknown> = [value];

  const children = obj[childrenKey] as Array<T> | undefined;
  if (children?.length) {
    for (const child of children) {
      result.push(...flattenObjectProperty(child, property, childrenKey));
    }
  }
  return result;
};

interface ProcessTreeItemProps {
  process: ProcessStats;
  level: number;
}

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  let out = "";
  if (h > 0) out += `${h}h `;
  if (m > 0 || h > 0) out += `${m}m `;
  out += `${sec}s`;
  return out;
}

function ProcessTreeItem({ process, level }: ProcessTreeItemProps) {
  const hasChildren = process.children.length > 0;
  const [isLocalExpanded, setIsLocalExpanded] = useState(true);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsLocalExpanded((prev) => !prev);
    }
  };

  return (
    <>
      <div
        className={cn(
          "hover:bg-muted/30 grid cursor-pointer grid-cols-12 items-center px-4 py-2 text-sm",
          level > 0 && "bg-muted/10",
        )}
      >
        <div
          className="col-span-3 flex items-center truncate font-mono"
          style={{ marginLeft: `${level * 16}px` }}
          onClick={handleToggle}
        >
          {hasChildren ? (
            <ChevronLeft
              className={cn(
                "text-muted-foreground mr-1 h-4 w-4 transition-transform",
                isLocalExpanded ? "rotate-90" : "-rotate-90",
              )}
            />
          ) : (
            <div className="mr-1 w-4" />
          )}
          <span className="truncate" title={process.processName}>
            {process.processName}
          </span>
        </div>
        <div className="col-span-2 text-right font-mono">{process.pid}</div>
        <div className="col-span-1 text-right font-mono">
          {process.numThreads}
        </div>
        <div className="col-span-1 text-right font-mono">
          {formatPercent(process.cpuPercent)}
        </div>
        <div className="col-span-1 text-right font-mono">
          {formatPercent(process.memoryPercent)}
        </div>
        <div className="col-span-1 text-right font-mono">
          {formatUptime(process.uptime)}
        </div>
        <div
          className="text-muted-foreground col-span-3 truncate pl-2 text-right font-mono"
          title={process.cmdline.join(" ")}
        >
          {process.cmdline.join(" ")}
        </div>
      </div>
      {hasChildren &&
        isLocalExpanded &&
        process.children.map((child, i) => (
          <ProcessTreeItem key={i} process={child} level={level + 1} />
        ))}
    </>
  );
}

function ProcessTree({ stats }: { stats: ProcessStats }) {
  return (
    <Card className="md:col-span-4">
      <CardHeader className="pb-2">
        <div>
          <CardTitle className="text-base">Process Tree</CardTitle>
          <CardDescription>
            Process hierarchy and resource usage
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground mb-2 grid grid-cols-12 px-4 py-2 text-xs font-medium">
          <div className="col-span-3">Process</div>
          <div className="col-span-2 text-right">PID</div>
          <div className="col-span-1 text-right">Threads</div>
          <div className="col-span-1 text-right">CPU %</div>
          <div className="col-span-1 text-right">Memory %</div>
          <div className="col-span-1 text-right">Uptime</div>
          <div className="col-span-3 text-right">Command</div>
        </div>
        <Separator className="mb-2" />
        <div>
          <ProcessTreeItem process={stats} level={0} />
        </div>
      </CardContent>
    </Card>
  );
}

export function AppStats({ appName }: { appName: string }) {
  const [app, setApp] = useState<App | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(1000); // 1 second default
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const data = await getApp(appName, true); // Request process stats
      setApp(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch stats",
      );
    } finally {
      setIsLoading(false);
    }
  }, [appName]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchStats, refreshInterval]);

  const handleRefreshIntervalChange = (value: string) => {
    setRefreshInterval(parseInt(value));
  };

  if (isLoading && !app) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading stats...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  if (!app || !app.processStats) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">No stats available</div>
      </div>
    );
  }

  const stats = app.processStats;

  // Calculate CPU times percentages if available
  const allCpuTimes = flattenObjectProperty(
    stats,
    "cpuTimes",
    "children",
  ) as (cpuTimesStat | null)[];
  let userPercent = 0;
  let systemPercent = 0;
  let idlePercent = 0;

  // Sum up CPU times across all processes
  const totalCpuTimes = allCpuTimes.reduce(
    (acc, curr) => {
      if (!curr) return acc;
      return {
        user: acc.user + curr.user,
        system: acc.system + curr.system,
        idle: acc.idle + curr.idle,
      };
    },
    {
      user: 0,
      system: 0,
      idle: 0,
    },
  );

  // Calculate percentages based on total times
  const totalCpuTime =
    totalCpuTimes.user + totalCpuTimes.system + totalCpuTimes.idle;
  if (totalCpuTime > 0) {
    userPercent = (totalCpuTimes.user / totalCpuTime) * 100;
    systemPercent = (totalCpuTimes.system / totalCpuTime) * 100;
    idlePercent = (totalCpuTimes.idle / totalCpuTime) * 100;
  }

  const cumulativeCpuPercent = flattenObjectProperty(
    stats,
    "cpuPercent",
    "children",
  ).reduce((acc, curr) => acc + (curr as number), 0);

  const cumulativeNumThreads = flattenObjectProperty(
    stats,
    "numThreads",
    "children",
  ).reduce((acc, curr) => acc + (curr as number), 0);

  const totalMemory =
    ((stats.memoryInfo?.rss ?? 0) / stats.memoryPercent) * 100;

  const cumulativeMemoryPercent = flattenObjectProperty(
    stats,
    "memoryPercent",
    "children",
  ).reduce((acc, curr) => acc + (curr as number), 0);

  const cumulativeMemoryRSS = flattenObjectProperty(
    stats,
    "memoryInfo.rss",
    "children",
  ).reduce((acc, curr) => acc + (curr as number), 0);

  const cumulativeMemoryVMS =
    flattenObjectProperty(stats, "memoryInfo.vms", "children").reduce(
      (acc, curr) => acc + (curr as number),
      0,
    ) / 1000;

  const cumulativeMemorySwap = flattenObjectProperty(
    stats,
    "memoryInfo.swap",
    "children",
  ).reduce((acc, curr) => acc + (curr as number), 0);

  const allConnections: ConnectionStat[] = flattenObjectProperty(
    stats,
    "connections",
    "children",
  ).flat() as ConnectionStat[];

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="px-2 text-sm font-medium">Resource Usage</span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">Auto-refresh:</span>
          <Select
            value={refreshInterval.toString()}
            onValueChange={handleRefreshIntervalChange}
          >
            <SelectTrigger className="w-auto">
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1000">1s</SelectItem>
              <SelectItem value="5000">5s</SelectItem>
              <SelectItem value="10000">10s</SelectItem>
              <SelectItem value="30000">30s</SelectItem>
              <SelectItem value="60000">1m</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-4 pb-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">CPU Usage</CardTitle>
            <CardDescription>Current processor utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-2xl font-bold">
                {formatPercent(cumulativeCpuPercent)}
              </span>
              <span className="text-muted-foreground text-xs">
                {cumulativeNumThreads} threads
              </span>
            </div>
            <Progress value={cumulativeCpuPercent} className="h-2" />
            {totalCpuTime > 0 && (
              <div className="text-muted-foreground mt-4 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="font-medium">User</div>
                  <div>{formatPercent(userPercent)}</div>
                </div>
                <div>
                  <div className="font-medium">System</div>
                  <div>{formatPercent(systemPercent)}</div>
                </div>
                <div>
                  <div className="font-medium">Idle</div>
                  <div>{formatPercent(idlePercent)}</div>
                </div>
              </div>
            )}
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
                {formatPercent(cumulativeMemoryPercent)}
              </span>
              {stats.memoryInfo && (
                <span className="text-muted-foreground text-xs">
                  {formatBytes(cumulativeMemoryRSS)} /{" "}
                  {formatBytes(totalMemory)}
                </span>
              )}
            </div>
            <Progress value={cumulativeMemoryPercent} className="h-2" />
            {stats.memoryInfo && (
              <div className="text-muted-foreground mt-4 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="font-medium">Resident</div>
                  <div>{formatBytes(cumulativeMemoryRSS)}</div>
                </div>
                <div>
                  <div className="font-medium">Virtual</div>
                  <div>{formatBytes(cumulativeMemoryVMS)}</div>
                </div>
                <div>
                  <div className="font-medium">Swap</div>
                  <div>{formatBytes(cumulativeMemorySwap)}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">App Uptime</CardTitle>
            <CardDescription>Time since app start</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(stats.uptime / (1000 * 60 * 60))}h{" "}
              {Math.floor((stats.uptime % (1000 * 60 * 60)) / (1000 * 60))}m
            </div>
            <div className="text-muted-foreground mt-2 text-sm">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Process Info</CardTitle>
            <CardDescription>Main process details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="mb-1 text-sm font-medium">PID</div>
                <div className="text-2xl font-bold">{stats.pid}</div>
              </div>
              {stats.memoryInfo && (
                <div>
                  <div className="mb-1 text-sm font-medium">Status</div>
                  <div className="text-2xl font-bold">
                    {stats.status
                      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                      .join(" ")}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Execution Info</CardTitle>
            <CardDescription>
              Process execution and permission details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="mb-1 text-sm font-medium">Executable</div>
                  <div className="font-mono text-sm">{stats.exe}</div>
                </div>
                <div>
                  <div className="mb-1 text-sm font-medium">Username</div>
                  <div className="font-mono text-sm">{stats.username}</div>
                </div>
              </div>
              <div>
                <div className="mb-1 text-sm font-medium">Command Line</div>
                <div className="font-mono text-sm break-all">
                  {stats.cmdline.join(" ")}
                </div>
              </div>
              <div>
                <div className="mb-1 text-sm font-medium">
                  Working Directory
                </div>
                <div className="font-mono text-sm break-all">{stats.cwd}</div>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="mb-1 text-sm font-medium">User IDs</div>
                  <div className="font-mono text-sm">
                    {[...new Set(stats.uids)].join(", ") || "None"}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-sm font-medium">Group IDs</div>
                  <div className="font-mono text-sm">
                    {[...new Set(stats.gids)].join(", ") || "None"}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-sm font-medium">Nice Value</div>
                  <div className="font-mono text-sm">{stats.nice}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Connections</CardTitle>
            <CardDescription>
              Open network connections for all processes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allConnections.length === 0 ? (
              <div className="text-muted-foreground text-sm">
                No connections found
              </div>
            ) : (
              <div className="overflow-x-auto" style={{ maxHeight: 320 }}>
                <div className="text-muted-foreground mb-2 grid grid-cols-8 gap-2 px-2 text-xs font-medium">
                  <div>FD</div>
                  <div>Family</div>
                  <div>Type</div>
                  <div>Local Address</div>
                  <div>Remote Address</div>
                  <div>Status</div>
                  <div>UIDs</div>
                  <div>PID</div>
                </div>
                <Separator className="mb-2" />
                <div className="space-y-1">
                  {allConnections.map((conn, i) => (
                    <div
                      key={i}
                      className="hover:bg-muted/30 grid grid-cols-8 items-center gap-2 rounded px-2 py-1 font-mono text-xs"
                    >
                      <div className="truncate">{conn.fd}</div>
                      <div className="truncate">
                        {formatFamily(conn.family)}
                      </div>
                      <div className="truncate">{formatType(conn.type)}</div>
                      <div
                        className="truncate"
                        title={`${conn.localaddr.ip}:${conn.localaddr.port}`}
                      >
                        {conn.localaddr.ip}:{conn.localaddr.port}
                      </div>
                      <div
                        className="truncate"
                        title={`${conn.remoteaddr.ip}:${conn.remoteaddr.port}`}
                      >
                        {conn.remoteaddr.ip}:{conn.remoteaddr.port}
                      </div>
                      <div className="truncate">{conn.status}</div>
                      <div className="truncate">
                        {conn.uids?.join(", ") || "None"}
                      </div>
                      <div className="truncate">{conn.pid}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <ProcessTree stats={stats} />
      </div>
    </div>
  );
}
