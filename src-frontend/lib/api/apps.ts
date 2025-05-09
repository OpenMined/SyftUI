import { useConnectionStore } from "@/stores/useConnectionStore";

interface AppInstallRequest {
  repoURL: string;
  branch?: string;
  tag?: string;
  commit?: string;
  force?: boolean;
}

interface AppListResponse {
  apps: string[];
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

export async function listApps(): Promise<string[]> {
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

  const data: AppListResponse = await response.json();
  return data.apps;
}
