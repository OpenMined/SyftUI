import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function AppLogs() {
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

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="px-2 text-sm font-medium">Application Logs</span>
        <Button variant="outline" size="sm">
          Clear Logs
        </Button>
      </div>
      <ScrollArea className="bg-background flex-1 rounded-lg border p-4 font-mono text-sm">
        {logs.map((log, index) => (
          <div key={index} className="mb-1">
            <span className="text-muted-foreground">{log.timestamp}</span>{" "}
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
  );
}
