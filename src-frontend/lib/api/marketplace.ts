import { marketplaceApps } from "@/lib/apps-data";
import { listApps } from "@/lib/api/apps";

export interface MarketplaceApp {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  author: string;
  stars: number;
  tags: string[];
  icon: string;
  installed: boolean;
  version?: string;
  lastUpdated?: string;
  screenshots?: string[];
  website?: string;
  repository?: string;
  branch?: string;
  license?: string;
  reviews?: {
    id: string;
    author: string;
    rating: number;
    date: string;
    comment: string;
  }[];
}

interface MarketplaceAppListResponse {
  apps: MarketplaceApp[];
}

export async function listMarketplaceApps(): Promise<MarketplaceAppListResponse> {
  // TODO: Replace with actual API call when backend is ready
  // const {
  //   settings: { url, token },
  // } = useConnectionStore.getState();
  // const response = await fetch(`${url}/v1/marketplace/apps/`, {
  //   headers: {
  //     Authorization: `Bearer ${token}`,
  //   },
  // });

  // if (!response.ok) {
  //   throw new Error(`Failed to list marketplace apps: ${response.statusText}`);
  // }

  // const data: MarketplaceAppListResponse = await response.json();
  // return data;

  // For now, return the hardcoded data with real installation status
  try {
    const installedApps = await listApps();
    const installedAppIds = new Set(installedApps.apps.map((app) => app.id));

    const appsWithInstallStatus = marketplaceApps.map((app) => ({
      ...app,
      installed: installedAppIds.has(app.id),
    }));

    return {
      apps: appsWithInstallStatus,
    };
  } catch (error) {
    console.error("Failed to check installation status:", error);
    // Fallback to original data with dummy install status
    return {
      apps: marketplaceApps,
    };
  }
}

export async function getMarketplaceApp(
  appId: string,
): Promise<MarketplaceApp> {
  // TODO: Replace with actual API call when backend is ready
  // const {
  //   settings: { url, token },
  // } = useConnectionStore.getState();
  // const response = await fetch(`${url}/v1/marketplace/apps/${appId}`, {
  //   headers: {
  //     Authorization: `Bearer ${token}`,
  //   },
  // });

  // if (!response.ok) {
  //   throw new Error(`Failed to get marketplace app: ${response.statusText}`);
  // }

  // const data: MarketplaceApp = await response.json();
  // return data;

  // For now, find the app in the hardcoded data and check real installation status
  const app = marketplaceApps.find((app) => app.id === appId);
  if (!app) {
    throw new Error(`Marketplace app not found: ${appId}`);
  }

  // Check if app is actually installed
  try {
    const installedApps = await listApps();
    const isInstalled = installedApps.apps.some(
      (installedApp) => installedApp.id === appId,
    );

    return {
      ...app,
      installed: isInstalled,
    };
  } catch (error) {
    console.error("Failed to check installation status:", error);
    // Fallback to original app data with dummy install status
    return app;
  }
}
