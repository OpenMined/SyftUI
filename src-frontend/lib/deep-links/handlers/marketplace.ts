import { useRouter } from "next/navigation";
import type { DeepLinkRoute } from "../parser";

export interface MarketplaceHandlerDeps {
  router: ReturnType<typeof useRouter>;
}

export function createMarketplaceHandler(deps: MarketplaceHandlerDeps) {
  return async function handleMarketplaceDeepLink(
    route: DeepLinkRoute,
  ): Promise<void> {
    const { router } = deps;

    if (route.type !== "marketplace") {
      return;
    }

    const appId = route.params?.id;
    const action = route.action;

    if (!appId) {
      return;
    }

    // Navigate to marketplace app detail page
    const marketplaceUrl = `/marketplace?id=${appId}`;

    if (action === "install") {
      // Add install action parameter for the marketplace component to handle
      router.push(`${marketplaceUrl}&action=install`);
    } else {
      // Just view the app
      router.push(marketplaceUrl);
    }
  };
}
