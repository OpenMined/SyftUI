"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { parseDeepLink } from "@/lib/deep-links/parser";
import { createDeepLinkRouter } from "@/lib/deep-links/router";
import { createWorkspaceHandler } from "@/lib/deep-links/handlers/workspace";
import { createAppsHandler } from "@/lib/deep-links/handlers/apps";
import { createMarketplaceHandler } from "@/lib/deep-links/handlers/marketplace";

const INITIAL_DEEP_LINKS_PROCESSED_KEY = "syft_initial_deep_links_processed";

export function DeepLinkRouter() {
  const router = useRouter();

  useEffect(() => {
    const handleDeepLink = async () => {
      if (typeof window !== "undefined" && window.__TAURI__) {
        const { onOpenUrl, getCurrent } = window.__TAURI__.deepLink;

        // Create handlers with dependencies
        const workspaceHandler = createWorkspaceHandler({ router });
        const appsHandler = createAppsHandler({ router });
        const marketplaceHandler = createMarketplaceHandler({ router });

        // Create the router
        const deepLinkRouter = createDeepLinkRouter({
          workspaceHandler,
          appsHandler,
          marketplaceHandler,
        });

        const processUrls = async (urls: string[]) => {
          console.log("Processing deep links:", urls);

          for (const url of urls) {
            try {
              const route = parseDeepLink(url);

              if (route) {
                console.log("Parsed deep link route:", route);
                await deepLinkRouter(route);
              } else {
                console.warn("Failed to parse deep link:", url);
                toast({
                  title: "Invalid deep link",
                  description: `Unable to handle link: ${url}`,
                  variant: "destructive",
                });
              }
            } catch (error) {
              console.error("Deep link handling failed:", error);
              toast({
                title: "Deep link error",
                description:
                  error instanceof Error
                    ? error.message
                    : "Failed to handle deep link",
                variant: "destructive",
              });
            }
          }
        };

        // Check for initial URLs that launched the app (run once per session)
        const hasProcessed = sessionStorage.getItem(
          INITIAL_DEEP_LINKS_PROCESSED_KEY,
        );
        if (!hasProcessed) {
          sessionStorage.setItem(INITIAL_DEEP_LINKS_PROCESSED_KEY, "true");
          try {
            const initialUrls = await getCurrent();
            if (initialUrls && initialUrls.length > 0) {
              console.log("Processing initial launch URLs:", initialUrls);
              await processUrls(initialUrls);
            }
          } catch (error) {
            console.log("No initial URLs or failed to get them:", error);
          }
        }

        // Listen for new deep link events while app is running
        await onOpenUrl(processUrls);
      }
    };

    handleDeepLink();
  }, [router]);

  return null; // This component doesn't render anything
}
