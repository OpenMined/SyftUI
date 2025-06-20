import Ansi from "ansi-to-react";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getLogs, type LogsResponse } from "@/lib/api/logs";
import { Badge } from "@/components/ui/badge";

export function AppLogs({ appId }: { appId: string }) {
  const [logs, setLogs] = useState<LogsResponse["logs"]>([]);
  const [nextToken, setNextToken] = useState<number>(1);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
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

  // Auto-scroll effect
  useEffect(() => {
    if (isAutoScroll && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [logs, isAutoScroll]);

  // set isAutoScroll to false when user scrolls up, and true when user scrolls to the bottom
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    );
    if (!scrollContainer) return;

    const handleScroll = () => {
      const isAtBottom =
        scrollContainer.scrollHeight - scrollContainer.scrollTop ===
        scrollContainer.clientHeight;
      setIsAutoScroll(isAtBottom);
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClear = () => {
    setLogs([]);
    setNextToken(1);
  };

  const getLevelColor = (level: string) => {
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
  };

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="px-2 text-sm font-medium">Application Logs</span>
        <Button variant="outline" size="sm" onClick={handleClear}>
          Clear Logs
        </Button>
      </div>
      <ScrollArea
        className="bg-background flex-1 rounded-lg border p-4 font-mono text-sm"
        ref={scrollAreaRef}
      >
        {logs.length === 0 ? (
          <div className="text-muted-foreground flex h-40 items-center justify-center">
            No logs to display
          </div>
        ) : (
          <table className="table-auto border-separate border-spacing-1 text-start">
            <tbody>
              {logs.map((log) => (
                <tr key={`${appId}-${log.lineNumber}`}>
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
              ))}
            </tbody>
          </table>
        )}
      </ScrollArea>
    </div>
  );
}
