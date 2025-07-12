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
      router.push(`/workspace${pathParam}`);
    } else if (route.type === "datasite") {
      // Navigate to datasite workspace
      const datasitePath = route.email
        ? `datasites/${route.email}`
        : "datasites";
      const fullPath = route.path
        ? `${datasitePath}/${route.path}`
        : datasitePath;
      const pathParam = `?path=${encodeURIComponent(fullPath)}`;

      router.push(`/workspace${pathParam}`);
    }
  };
}
