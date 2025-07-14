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
    const targetUrl =
      action === "install"
        ? `${marketplaceUrl}&action=install`
        : marketplaceUrl;

    // Check if we're on the home page (initial load)
    if (window.location.pathname === "/" || window.location.pathname === "") {
      // Redirect through home page with next parameter
      const nextUrl = `/?next=${encodeURIComponent(targetUrl)}`;
      router.push(nextUrl);
    } else {
      // Direct navigation if already in the app
      router.push(targetUrl);
    }
  };
}
