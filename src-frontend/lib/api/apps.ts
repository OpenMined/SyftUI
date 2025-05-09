import { useConnectionStore } from "@/stores/useConnectionStore";

interface App {
  id: string;
  name: string;
  path: string;
  pid: number;
  status: string;
  port: number;
  cpu: number;
  memory: number;
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

  const response = await fetch(`${url}/v1/app/install`, {
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

  const response = await fetch(`${url}/v1/app/uninstall?appName=${appName}`, {
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

  const response = await fetch(`${url}/v1/app/list`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to list apps: ${response.statusText}`);
  }

  const { apps: appNames }: string[] = await response.json();
  const apps: App[] = [];
  for (const appName of appNames) {
    const app = {
      id: `openmined-${appName}`,
      name: appName,
      path: `/apps/${appName}`,
      pid: 0,
      status: "running",
      port: "-",
      cpu: 0.1,
      memory: 2048,
    };
    apps.push(app);
  }
  const data: AppListResponse = { apps };
  return data;
}
