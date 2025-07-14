import { useRouter } from "next/navigation";
import type { DeepLinkRoute } from "../parser";

export interface WorkspaceHandlerDeps {
  router: ReturnType<typeof useRouter>;
}

export function createWorkspaceHandler(deps: WorkspaceHandlerDeps) {
  return async function handleWorkspaceDeepLink(
    route: DeepLinkRoute,
  ): Promise<void> {
    const { router } = deps;

    if (route.type === "workspace") {
      // Navigate to workspace with the specified path
      const pathParam = route.path
        ? `?path=${encodeURIComponent(route.path)}`
        : "";
      const workspaceUrl = `/workspace${pathParam}`;

      // Check if we're on the home page (initial load)
      if (window.location.pathname === "/" || window.location.pathname === "") {
        // Redirect through home page with next parameter
        const nextUrl = `/?next=${encodeURIComponent(workspaceUrl)}`;
        router.push(nextUrl);
      } else {
        // Direct navigation if already in the app
        router.push(workspaceUrl);
      }
    } else if (route.type === "datasite") {
      // Navigate to datasite workspace
      const datasitePath = route.email
        ? `datasites/${route.email}`
        : "datasites";
      const fullPath = route.path
        ? `${datasitePath}/${route.path}`
        : datasitePath;
      const pathParam = `?path=${encodeURIComponent(fullPath)}`;
      const workspaceUrl = `/workspace${pathParam}`;

      // Check if we're on the home page (initial load)
      if (window.location.pathname === "/" || window.location.pathname === "") {
        // Redirect through home page with next parameter
        const nextUrl = `/?next=${encodeURIComponent(workspaceUrl)}`;
        router.push(nextUrl);
      } else {
        // Direct navigation if already in the app
        router.push(workspaceUrl);
      }
    }
  };
}
