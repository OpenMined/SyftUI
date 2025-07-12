"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { parseDeepLink } from "@/lib/deep-links/parser";
import { createDeepLinkRouter } from "@/lib/deep-links/router";
import { createWorkspaceHandler } from "@/lib/deep-links/handlers/workspace";
import { createAppsHandler } from "@/lib/deep-links/handlers/apps";

export function DeepLinkRouter() {
  const router = useRouter();

  useEffect(() => {
    const handleDeepLink = async () => {
      if (typeof window !== "undefined" && window.__TAURI__) {
        const { onOpenUrl } = window.__TAURI__.deepLink;

        // Create handlers with dependencies
        const workspaceHandler = createWorkspaceHandler({ router });
        const appsHandler = createAppsHandler({ router });

        // Create the router
        const deepLinkRouter = createDeepLinkRouter({
          workspaceHandler,
          appsHandler,
        });

        await onOpenUrl(async (urls) => {
          console.log("Deep link received:", urls);

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
        });
      }
    };

    handleDeepLink();
  }, [router]);

  return null; // This component doesn't render anything
}
