import { useConnectionStore } from "@/stores/useConnectionStore";

export const logLevels: string[] = ["debug", "info", "warn", "error"];

interface Log {
  lineNumber: number;
  timestamp: string;
  message: string;
}

export interface LogsResponse {
  logs: Log[];
  nextToken: number;
  hasMore: boolean;
}

export interface ParsedLog {
  lineNumber: number;
  timestamp: string;
  level: (typeof logLevels)[number];
  message: string;
}

export interface ParsedLogResponse {
  logs: ParsedLog[];
  nextToken: number;
  hasMore: boolean;
}

/**
 * Get logs with pagination support
 * @param request - The request parameters for fetching logs
 * @returns A promise that resolves to the logs response
 */
export async function getLogs(
  appId: string,
  startingToken: number,
  maxResults: number,
): Promise<ParsedLogResponse> {
  const {
    settings: { url, token },
  } = useConnectionStore.getState();

  const params = new URLSearchParams();
  params.append("appId", appId);
  params.append("startingToken", startingToken.toString());
  params.append("maxResults", maxResults.toString());

  const response = await fetch(`${url}/v1/logs?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch logs: ${response.statusText}`);
  }

  const { logs, nextToken, hasMore }: LogsResponse = await response.json();
  return {
    logs: logs.map((log) => parseLog(log)),
    nextToken,
    hasMore,
  };
}

function parseLog({ lineNumber, timestamp, message }: Log): ParsedLog {
  const level = message.match(/^.*?\[?(DEBUG|INFO|WARN|WARNING|ERROR)\]?:?/i);

  // rest of the line is the message
  message = message.slice(level?.[0].length || 0).trim();
  // remove msg= from the message
  message = message.replace(/^msg=/, "").trim();
  // remove single / double quotes from the message
  message = message.replace(/^['"]/, "").replace(/['"]$/, "").trim();
  return {
    lineNumber,
    timestamp,
    level: level?.[1]?.toLowerCase() ?? "info",
    message,
  };
}

/**
 * Download logs as a zip file
 * @returns A promise that resolves to the logs zip file as a Blob
 */
export async function downloadLogs(): Promise<Blob> {
  const {
    settings: { url, token },
  } = useConnectionStore.getState();

  const response = await fetch(`${url}/v1/logs/download`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download logs: ${response.statusText}`);
  }

  return response.blob();
}
