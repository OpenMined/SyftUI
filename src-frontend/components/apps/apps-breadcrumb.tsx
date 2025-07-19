"use client";

import type React from "react";
import { useQueryState } from "nuqs";
import { useRouter } from "next/navigation";
import { ChevronRight, AppWindow } from "lucide-react";
import { type App } from "@/lib/api/apps";
import { Suspense } from "react";

interface AppBreadcrumbContentProps {
  app: App | null;
}

function AppBreadcrumbContent({ app }: AppBreadcrumbContentProps) {
  const router = useRouter();
  const [selectedApp] = useQueryState("id");

  const handleNavigateToApps = () => {
    router.push("/apps");
  };

  const handleNavigateToApp = () => {
    if (selectedApp) {
      router.push(`/apps?id=${selectedApp}`);
    }
  };

  return (
    <div className="inline-flex items-center">
      <button
        onClick={handleNavigateToApps}
        className="hover:bg-accent-foreground/15 hover:text-accent-foreground flex items-center gap-2 rounded-md p-1 text-sm"
      >
        <AppWindow className="h-4 w-4" />
        <span>Apps</span>
      </button>

      {selectedApp && app != null && (
        <>
          <ChevronRight className="text-muted-foreground mx-1 h-4 w-4" />
          <button
            onClick={handleNavigateToApp}
            className="hover:bg-accent-foreground/15 hover:text-accent-foreground rounded-md p-1 text-sm"
          >
            {app.info.name}
          </button>
        </>
      )}
    </div>
  );
}

interface AppBreadcrumbProps {
  app: App | null;
}

export function AppBreadcrumb({ app }: AppBreadcrumbProps) {
  return (
    <Suspense
      fallback={
        <div className="inline-flex items-center">
          <div className="hover:bg-accent-foreground/15 hover:text-accent-foreground flex items-center gap-2 rounded-md p-1 text-sm">
            <AppWindow className="h-4 w-4" />
            <span>Apps</span>
          </div>
        </div>
      }
    >
      <AppBreadcrumbContent app={app} />
    </Suspense>
  );
}
