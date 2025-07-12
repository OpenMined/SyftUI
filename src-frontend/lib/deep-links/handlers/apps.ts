import { useRouter } from "next/navigation";
import { installApp, listApps } from "@/lib/api/apps";
import { getMarketplaceApp } from "@/lib/api/marketplace";
import { toast } from "@/hooks/use-toast";
import type { DeepLinkRoute } from "../parser";

export interface AppsHandlerDeps {
  router: ReturnType<typeof useRouter>;
}

export function createAppsHandler(deps: AppsHandlerDeps) {
  return async function handleAppsDeepLink(
    route: DeepLinkRoute,
  ): Promise<void> {
    const { router } = deps;

    if (route.type !== "apps" || route.action !== "install") {
      return;
    }

    const appId = route.params?.id;
    const shouldOpen = route.params?.open === "true";

    if (!appId) {
      toast({
        icon: "❌",
        title: "Invalid app link",
        description: "App ID is required for installation",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get marketplace app by ID
      const marketplaceApp = await getMarketplaceApp(appId);

      if (!marketplaceApp) {
        toast({
          icon: "❌",
          title: "App not found",
          description: `App with ID "${appId}" not found in marketplace`,
          variant: "destructive",
        });
        return;
      }

      if (!marketplaceApp.repository) {
        toast({
          icon: "❌",
          title: "Installation Failed",
          description: "App repository URL is not available",
          variant: "destructive",
        });
        return;
      }

      // Check if app is already installed
      const installedApps = await listApps();
      const existingApp = installedApps.apps.find((app) => app.id === appId);

      if (existingApp) {
        // App already installed
        toast({
          icon: "✅",
          title: "App already installed",
          description: `${marketplaceApp.name} is already installed`,
        });

        // Navigate to app if open=true
        if (shouldOpen) {
          router.push(`/apps?id=${appId}`);
        }
        return;
      }

      // Show loading toast (using the app icon from marketplace data)
      toast({
        icon: marketplaceApp.icon || "📦",
        title: "Installing app",
        description: `Installing ${marketplaceApp.name}...`,
      });

      // Install app using repository URL
      await installApp({
        repoURL: marketplaceApp.repository,
        branch: marketplaceApp.branch || "main",
        force: false,
      });

      // Success toast
      toast({
        icon: "🎉",
        title: "App Installed!",
        description: `${marketplaceApp.name} has been successfully installed.`,
        variant: "default",
      });

      // Navigate to apps page if open=true
      if (shouldOpen) {
        router.push(`/apps?id=${appId}`);
      }
    } catch (error) {
      console.error("Failed to install app:", error);

      toast({
        icon: "❌",
        title: "Installation Failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };
}
