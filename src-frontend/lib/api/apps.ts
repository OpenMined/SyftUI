import { useConnectionStore } from "@/stores/useConnectionStore";

export interface CpuTimesStat {
  user: number;
  system: number;
  idle: number;
  nice: number;
  iowait: number;
  irq: number;
  softirq: number;
  steal: number;
  guest: number;
  guestNice: number;
}

interface MemoryInfoStat {
  rss: number;
  vms: number;
  hwm: number;
  data: number;
  stack: number;
  locked: number;
  swap: number;
}

export interface ConnectionStat {
  fd: number;
  family: number;
  type: number;
  localaddr: {
    ip: string;
    port: number;
  };
  remoteaddr: {
    ip: string;
    port: number;
  };
  status: string;
  uids: number[] | null;
  pid: number;
}

export type AppStatus = "running" | "stopped";

export interface ProcessStats {
  processName: string;
  pid: number;
  status: string[];
  cmdline: string[];
  cwd: string;
  environ: string[];
  exe: string;
  gids: number[];
  uids: number[];
  nice: number;
  username: string;
  connections: ConnectionStat[];
  cpuPercent: number;
  cpuTimes: CpuTimesStat | null;
  numThreads: number;
  memoryPercent: number;
  memoryInfo: MemoryInfoStat | null;
  uptime: number;
  children: ProcessStats[];
}

export interface AppInfo {
  id: string;
  name: string;
  path: string;
  source: string;
  sourceURI: string;
  branch?: string;
  installedOn: string;
}

export interface App {
  id: string;
  name: string;
  path: string;
  status: AppStatus;
  pid: number;
  ports: number[];
  info: AppInfo;
  processStats?: ProcessStats;
}

export interface AppInstallRequest {
  repoURL: string;
  branch?: string;
  force?: boolean;
}

export interface AppListResponse {
  apps: App[];
}

export async function installApp(request: AppInstallRequest): Promise<void> {
  const {
    settings: { url, token },
  } = useConnectionStore.getState();

  const response = await fetch(`${url}/v1/apps/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.error || `Failed to install app: ${response.statusText}`,
    );
  }
}

export async function uninstallApp(appId: string): Promise<void> {
  const {
    settings: { url, token },
  } = useConnectionStore.getState();

  const response = await fetch(`${url}/v1/apps/${appId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to uninstall app: ${response.statusText}`);
  }
}

export async function listApps(): Promise<AppListResponse> {
  const {
    settings: { url, token },
  } = useConnectionStore.getState();

  const response = await fetch(`${url}/v1/apps/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to list apps: ${response.statusText}`);
  }

  const data: AppListResponse = await response.json();
  data.apps.forEach((app) => {
    app.ports = app.ports?.sort((a, b) => a - b) || [];
  });
  return data;
}

export async function getApp(
  appId: string,
  processStats: boolean = false,
): Promise<App> {
  const {
    settings: { url, token },
  } = useConnectionStore.getState();

  const queryParams = new URLSearchParams();
  if (processStats) {
    queryParams.append("processStats", "true");
  }

  console.log(`${url}/v1/apps/${appId}?${queryParams.toString()}`);
  const response = await fetch(
    `${url}/v1/apps/${appId}?${queryParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to get app: ${response.statusText}`);
  }

  const data: App = await response.json();
  data.ports = data.ports?.sort((a, b) => a - b) || [];
  return data;
}

export async function startApp(appId: string): Promise<void> {
  const {
    settings: { url, token },
  } = useConnectionStore.getState();

  const response = await fetch(`${url}/v1/apps/${appId}/start`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to start app: ${response.statusText}`);
  }
}

export async function stopApp(appId: string): Promise<void> {
  const {
    settings: { url, token },
  } = useConnectionStore.getState();

  const response = await fetch(`${url}/v1/apps/${appId}/stop`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to stop app: ${response.statusText}`);
  }
}
