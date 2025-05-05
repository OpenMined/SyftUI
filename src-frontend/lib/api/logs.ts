import { useConnectionStore } from "@/stores/useConnectionStore";

export const logLevels: string[] = ["debug", "info", "warn", "error"];

interface Log {
  timestamp: string;
  level: (typeof logLevels)[number];
  message: string;
}

interface LogsResponse {
  logs: Log[];
  nextToken: number;
}

/**
 * Get logs with pagination support
 * @param request - The request parameters for fetching logs
 * @returns A promise that resolves to the logs response
 */
export async function getLogs(
  startingToken: number,
  maxResults: number,
): Promise<LogsResponse> {
  const {
    settings: { url, token },
  } = useConnectionStore.getState();

  const params = new URLSearchParams();
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

  const data: LogsResponse = await response.json();
  return data;
}
