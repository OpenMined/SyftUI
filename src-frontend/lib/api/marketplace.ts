import { marketplaceApps } from "@/lib/apps-data";

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

  // For now, return the hardcoded data
  return {
    apps: marketplaceApps,
  };
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

  // For now, find the app in the hardcoded data
  const app = marketplaceApps.find((app) => app.id === appId);
  if (!app) {
    throw new Error(`Marketplace app not found: ${appId}`);
  }

  return app;
}
