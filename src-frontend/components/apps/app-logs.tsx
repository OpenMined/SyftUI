import Ansi from "ansi-to-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getLogs, type ParsedLogResponse } from "@/lib/api/logs";
import { Badge } from "@/components/ui/badge";
import { useVirtualizer } from "@tanstack/react-virtual";

const MAX_LOGS = 5000; // Limit logs for app view

export function AppLogs({ appId }: { appId: string }) {
  const [logs, setLogs] = useState<ParsedLogResponse["logs"]>([]);
  const [nextToken, setNextToken] = useState<number>(1);
  const [isAutoScroll, setIsAutoScroll] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const logsRef = useRef(logs);
  const nextTokenRef = useRef(nextToken);

  // Keep refs in sync with state
  useEffect(() => {
    logsRef.current = logs;
    nextTokenRef.current = nextToken;
  }, [logs, nextToken]);

  // Poll for new logs
  useEffect(() => {
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
  }, [appId]);

  // Virtualizer for efficient rendering - add 1 for dummy item
  const virtualizer = useVirtualizer({
    count: logs.length + 1, // +1 for dummy end marker
    getScrollElement: () => {
      const scrollContainer = scrollAreaRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      return scrollContainer as HTMLElement;
    },
    estimateSize: (index) => {
      // Dummy item at the end has minimal height
      return index === logs.length ? 1 : 30;
    },
    overscan: 10,
  });

  // Auto-scroll effect
  useEffect(() => {
    if (isAutoScroll && logs.length > 0) {
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
  }, [logs.length, isAutoScroll]);

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
    setNextToken(1);
  }, []);

  const getLevelColor = useCallback((level: string) => {
    switch (level) {
      case "debug":
        return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100 hover:text-gray-800 hover:border-gray-200";
      case "info":
        return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 hover:text-blue-800 hover:border-blue-200";
      case "warn":
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 hover:text-yellow-800 hover:border-yellow-200";
      case "error":
        return "bg-red-100 text-red-800 border-red-200 hover:bg-red-100 hover:text-red-800 hover:border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }, []);

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="px-2 text-sm font-medium">Application Logs</span>
        <Button variant="outline" size="sm" onClick={handleClear}>
          Clear Logs
        </Button>
      </div>
      <ScrollArea
        className="bg-background relative flex-1 rounded-lg border p-4 font-mono text-sm"
        ref={scrollAreaRef}
      >
        {logs.length === 0 ? (
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
                    if (virtualItem.index === logs.length) {
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

                    const log = logs[virtualItem.index];
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
                          <Badge className={getLevelColor(log.level)}>
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

        {/* Floating scroll to bottom button */}
        {!isAutoScroll && logs.length > 0 && (
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
