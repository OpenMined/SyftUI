import { useConnectionStore } from "@/stores/useConnectionStore";

interface App {
  name: string;
  path: string;
  status: string;
  pid: number;
  ports: number[];
  cpu: number;
  memory: number;
  uptime: number;
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
  return data;
}

export async function getApp(appName: string): Promise<App> {
  const {
    settings: { url, token },
  } = useConnectionStore.getState();

  const response = await fetch(`${url}/v1/apps/${appName}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get app: ${response.statusText}`);
  }

  const data: App = await response.json();
  return data;
}
