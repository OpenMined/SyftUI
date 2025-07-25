"use client";

import Ansi from "ansi-to-react";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Download, Trash2, Pause, Play, Search, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toolbar } from "@/components/ui/toolbar";
import { cn } from "@/lib/utils";
import {
  getLogs,
  logLevels,
  downloadLogs,
  type ParsedLog,
} from "@/lib/api/logs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listApps } from "@/lib/api/apps";
import { useVirtualizer } from "@tanstack/react-virtual";

const MAX_LOGS = 10000; // Limit logs to prevent memory issues

export function Logs() {
  const [logs, setLogs] = useState<ParsedLog[]>([]);
  const [appId, setAppId] = useState("system");
  const [nextToken, setNextToken] = useState<number>(1);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState("");
  const [filterLevel, setFilterLevel] = useState<string | null>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(false);
  const [installedApps, setInstalledApps] = useState<string[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const logsRef = useRef(logs);
  const nextTokenRef = useRef(nextToken);
  const parentRef = useRef<HTMLDivElement>(null);

  // Fetch installed apps
  useEffect(() => {
    const fetchApps = async () => {
      const { apps } = await listApps();
      setInstalledApps(apps.map((app) => app.id));
    };
    fetchApps();
  }, [appId]);

  // Keep refs in sync with state
  useEffect(() => {
    logsRef.current = logs;
    nextTokenRef.current = nextToken;
  }, [logs, nextToken]);

  // Poll for new logs
  useEffect(() => {
    if (isPaused) return;

    let isFetching = false;

    const fetchAllLogs = async () => {
      if (isFetching) return;
      isFetching = true;
      try {
        let accumulatedLogs = [...logsRef.current];
        let localNextToken = nextTokenRef.current;
        let hasMore = true;
        while (hasMore) {
          const response = await getLogs(appId, localNextToken, 1000);
          accumulatedLogs = [...accumulatedLogs, ...response.logs];

          // Limit logs to prevent memory issues
          if (accumulatedLogs.length > MAX_LOGS) {
            accumulatedLogs = accumulatedLogs.slice(-MAX_LOGS);
          }

          localNextToken = response.nextToken;
          hasMore = response.hasMore;
          setLogs([...accumulatedLogs]);
          setNextToken(localNextToken);
        }
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      } finally {
        isFetching = false;
      }
    };

    // Make the first request immediately
    fetchAllLogs();

    // Then set up the interval for subsequent requests
    const interval = setInterval(fetchAllLogs, 3000);
    return () => clearInterval(interval);
  }, [appId, isPaused]);

  // Memoize filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesText = filter
        ? log.message.toLowerCase().includes(filter.toLowerCase())
        : true;
      const matchesLevel = filterLevel ? log.level === filterLevel : true;
      return matchesText && matchesLevel;
    });
  }, [logs, filter, filterLevel]);

  // Virtualizer for efficient rendering - add 1 for dummy item
  const virtualizer = useVirtualizer({
    count: filteredLogs.length + 1, // +1 for dummy end marker
    getScrollElement: () => {
      const scrollContainer = scrollAreaRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      return scrollContainer as HTMLElement;
    },
    estimateSize: (index) => {
      // Dummy item at the end has minimal height
      return index === filteredLogs.length ? 1 : 30;
    },
    overscan: 10,
  });

  // Auto-scroll effect
  useEffect(() => {
    if (isAutoScroll && filteredLogs.length > 0) {
      const scrollContainer = scrollAreaRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        // Use requestAnimationFrame to ensure DOM has updated
        requestAnimationFrame(() => {
          // Get the actual content height from the virtual container
          const virtualContent = scrollContainer.querySelector(
            '[style*="height"]',
          ) as HTMLElement;
          if (virtualContent) {
            const contentHeight = parseInt(virtualContent.style.height);
            scrollContainer.scrollTop = contentHeight;
          }
        });
      }
    }
  }, [filteredLogs.length, isAutoScroll]);

  // set isAutoScroll to false when user scrolls up, and true when user scrolls to the bottom
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    );
    if (!scrollContainer) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      // Debounce scroll events
      clearTimeout(scrollTimeout);

      scrollTimeout = setTimeout(() => {
        // For virtualized content, we need to check against the virtual total size
        const virtualHeight = virtualizer.getTotalSize();
        const scrollTop = scrollContainer.scrollTop;
        const clientHeight = scrollContainer.clientHeight;
        const threshold = 100; // Increased threshold for virtual scrolling

        const distanceFromBottom = virtualHeight - scrollTop - clientHeight;
        const isAtBottom = distanceFromBottom < threshold;

        // Only update if the value actually changes
        setIsAutoScroll((prev) => {
          if (prev !== isAtBottom) {
            return isAtBottom;
          }
          return prev;
        });
      }, 100);
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [virtualizer]);

  const handleClear = useCallback(() => {
    setLogs([]);
  }, []);

  const handleAppChange = useCallback((value: string) => {
    setAppId(value);
    setLogs([]);
    setNextToken(1);
  }, []);

  const handleDownload = useCallback(async () => {
    // current utc datetime in format YYYY-MM-DD_HH-MM-SS
    const now = new Date()
      .toISOString()
      .replace(/T/, "_")
      .replace(/:/g, "-")
      .split(".")[0];

    try {
      const blob = await downloadLogs();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SyftBox-${now}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download logs:", error);
    }
  }, []);

  const getLevelColor = useCallback((level: string) => {
    switch (level) {
      case "debug":
        return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 hover:text-gray-900 hover:border-gray-300";
      case "info":
        return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 hover:text-blue-900 hover:border-blue-300";
      case "warn":
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 hover:text-yellow-900 hover:border-yellow-300";
      case "error":
        return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200 hover:text-red-900 hover:border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }, []);

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className="flex h-full flex-col">
      <Toolbar
        leftSection={
          <div className="flex items-center gap-2">
            <div className="flex gap-2">
              {logLevels.map((level) => (
                <Badge
                  key={level}
                  className={cn(
                    "cursor-pointer select-none",
                    getLevelColor(level),
                    filterLevel !== null &&
                      filterLevel !== level &&
                      "brightness-125 dark:brightness-[20%]",
                  )}
                  onClick={() =>
                    setFilterLevel(filterLevel === level ? null : level)
                  }
                >
                  {level.toUpperCase()}
                </Badge>
              ))}
            </div>
            <Select value={appId} onValueChange={handleAppChange}>
              <SelectTrigger className="h-8 select-none">
                <SelectValue placeholder="Select app" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                {installedApps.map((appId) => (
                  <SelectItem key={appId} value={appId}>
                    {appId.split(".").pop()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      >
        <div className="relative w-72">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
          <Input
            placeholder="Filter logs..."
            className="pl-9"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsPaused(!isPaused)}
          title={isPaused ? "Resume" : "Pause"}
        >
          {isPaused ? (
            <Play className="h-4 w-4" />
          ) : (
            <Pause className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleClear}
          title="Clear Logs"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleDownload}
          title="Download Logs"
        >
          <Download className="h-4 w-4" />
        </Button>
      </Toolbar>

      <ScrollArea className="relative flex-1" ref={scrollAreaRef}>
        <div className="p-4 font-mono text-sm" ref={parentRef}>
          {filteredLogs.length === 0 ? (
            <div className="text-muted-foreground flex h-40 items-center justify-center">
              No logs to display
            </div>
          ) : (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualItems[0]?.start ?? 0}px)`,
                }}
              >
                <table className="table-auto border-separate border-spacing-1 text-start">
                  <tbody>
                    {virtualItems.map((virtualItem) => {
                      // Check if this is the dummy item
                      if (virtualItem.index === filteredLogs.length) {
                        return (
                          <tr
                            key="dummy-end-marker"
                            data-index={virtualItem.index}
                            ref={virtualizer.measureElement}
                            style={{
                              height: `${virtualItem.size}px`,
                            }}
                          >
                            <td colSpan={3}>&nbsp;</td>
                          </tr>
                        );
                      }

                      const log = filteredLogs[virtualItem.index];
                      return (
                        <tr
                          key={`${appId}-${log.lineNumber}`}
                          data-index={virtualItem.index}
                          ref={virtualizer.measureElement}
                          style={{
                            height: `${virtualItem.size}px`,
                          }}
                        >
                          <td className="text-muted-foreground align-baseline text-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="w-16 text-end align-baseline">
                            <Badge
                              className={cn(
                                "cursor-pointer select-none",
                                getLevelColor(log.level),
                              )}
                              onClick={() =>
                                setFilterLevel(
                                  filterLevel === log.level ? null : log.level,
                                )
                              }
                            >
                              {log.level.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="align-baseline text-wrap">
                            <Ansi>{log.message}</Ansi>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Floating scroll to bottom button */}
        {!isAutoScroll && filteredLogs.length > 0 && (
          <Button
            className="absolute right-4 bottom-4 z-10 shadow-lg"
            size="icon"
            onClick={() => {
              const scrollContainer = scrollAreaRef.current?.querySelector(
                "[data-radix-scroll-area-viewport]",
              );
              if (scrollContainer) {
                // Get the actual content height from the virtual container
                const virtualContent = scrollContainer.querySelector(
                  '[style*="height"]',
                ) as HTMLElement;
                if (virtualContent) {
                  const contentHeight = parseInt(virtualContent.style.height);
                  scrollContainer.scrollTop = contentHeight;
                }
                // Force auto-scroll back on when clicking the button
                setIsAutoScroll(true);
              }
            }}
            title="Scroll to bottom"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}
      </ScrollArea>
    </div>
  );
}
