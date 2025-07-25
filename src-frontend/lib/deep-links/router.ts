import type { DeepLinkRoute } from "./parser";

export interface DeepLinkRouterDeps {
  workspaceHandler: (route: DeepLinkRoute) => Promise<void>;
  marketplaceHandler: (route: DeepLinkRoute) => Promise<void>;
}

export function createDeepLinkRouter(deps: DeepLinkRouterDeps) {
  return async function routeDeepLink(route: DeepLinkRoute): Promise<void> {
    const { workspaceHandler, marketplaceHandler } = deps;

    try {
      switch (route.type) {
        case "datasite":
        case "workspace":
          await workspaceHandler(route);
          break;

        case "marketplace":
          await marketplaceHandler(route);
          break;

        default:
          console.warn("Unknown deep link route type:", route.type);
      }
    } catch (error) {
      console.error("Deep link routing failed:", error);
      throw error;
    }
  };
}
