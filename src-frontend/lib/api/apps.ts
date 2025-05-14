import { useConnectionStore } from "@/stores/useConnectionStore";

interface cpuTimesStat {
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

interface ConnectionStat {
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

type AppStatus = "running" | "stopped";

interface ProcessStats {
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
  cpuTimes: cpuTimesStat | null;
  numThreads: number;
  memoryPercent: number;
  memoryInfo: MemoryInfoStat | null;
  uptime: number;
  children: ProcessStats[];
}

interface App {
  name: string;
  path: string;
  status: AppStatus;
  pid: number;
  ports: number[];
  processStats?: ProcessStats;
}

interface AppInstallRequest {
  repoURL: string;
  branch?: string;
  tag?: string;
  commit?: string;
  force?: boolean;
}

interface AppListResponse {
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

export async function uninstallApp(appName: string): Promise<void> {
  const {
    settings: { url, token },
  } = useConnectionStore.getState();

  const response = await fetch(`${url}/v1/apps/${appName}`, {
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
  appName: string,
  processStats: boolean = false,
): Promise<App> {
  const {
    settings: { url, token },
  } = useConnectionStore.getState();

  const queryParams = new URLSearchParams();
  if (processStats) {
    queryParams.append("processStats", "true");
  }

  const response = await fetch(
    `${url}/v1/apps/${appName}?${queryParams.toString()}`,
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
