"use client";

import { useEffect, useState, useRef } from "react";
import {
  ScrollText,
  Download,
  Trash2,
  Pause,
  Play,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toolbar } from "@/components/ui/toolbar";
import { cn } from "@/lib/utils";
import { getLogs, logLevels, type LogsResponse } from "@/lib/api/logs";

export function Logs() {
  const [logs, setLogs] = useState<LogsResponse["logs"]>([]);
  const [nextToken, setNextToken] = useState<number>(0);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState("");
  const [filterLevel, setFilterLevel] = useState<string | null>(null);
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
    if (isPaused) return;

    const fetchLogs = async () => {
      try {
        const response = await getLogs(nextTokenRef.current, 100);
        setLogs([...logsRef.current, ...response.logs]);
        setNextToken(response.nextToken);
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      }
    };

    // Make the first request immediately
    fetchLogs();

    // Then set up the interval for subsequent requests
    const interval = setInterval(fetchLogs, 3000);

    return () => clearInterval(interval);
  }, [isPaused]); // Only depend on isPaused

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

  const filteredLogs = logs.filter((log) => {
    const matchesText = filter
      ? log.message.toLowerCase().includes(filter.toLowerCase())
      : true;
    const matchesLevel = filterLevel ? log.level === filterLevel : true;
    return matchesText && matchesLevel;
  });

  const handleClear = () => {
    setLogs([]);
  };

  const handleDownload = () => {
    const logText = logs
      .map(
        (log) =>
          `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`,
      )
      .join("\n");
    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "debug":
        return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 hover:text-gray-900 hover:border-gray-300";
      case "info":
        return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 hover:text-blue-900 hover:border-blue-300";
      case "warn":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 hover:text-yellow-900 hover:border-yellow-300";
      case "error":
        return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200 hover:text-red-900 hover:border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="flex h-full flex-col">
      <Toolbar title="System Logs" icon={<ScrollText className="h-5 w-5" />}>
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

      <div className="flex gap-2 overflow-x-auto border-b p-2">
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
            onClick={() => setFilterLevel(filterLevel === level ? null : level)}
          >
            {level.toUpperCase()}
          </Badge>
        ))}
      </div>

      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 font-mono text-sm">
          {filteredLogs.length === 0 ? (
            <div className="text-muted-foreground flex h-40 items-center justify-center">
              No logs to display
            </div>
          ) : (
            <table className="table-auto border-separate border-spacing-1 text-start">
              <tbody>
                {filteredLogs.map((log, index) => (
                  <tr key={index}>
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
                    <td className="align-baseline text-wrap whitespace-pre">
                      {log.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
