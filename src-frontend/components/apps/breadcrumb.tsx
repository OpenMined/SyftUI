"use client";

import type React from "react";
import { useQueryState } from "nuqs";
import { useRouter } from "next/navigation";
import { ChevronRight, AppWindow } from "lucide-react";
import { getApp, type App } from "@/lib/api/apps";
import { useEffect, useState } from "react";

export function AppBreadcrumb() {
  const router = useRouter();
  const [selectedApp] = useQueryState("id");
  const [app, setApp] = useState<App | null>(null);

  // Fetch app details when selectedApp changes
  useEffect(() => {
    if (selectedApp) {
      getApp(selectedApp).then(setApp).catch(console.error);
    } else {
      setApp(null);
    }
  }, [selectedApp]);

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
        className="hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md p-1 text-sm"
      >
        <AppWindow className="h-4 w-4" />
        <span>Apps</span>
      </button>

      {selectedApp && app && (
        <>
          <ChevronRight className="text-muted-foreground mx-1 h-4 w-4" />
          <button
            onClick={handleNavigateToApp}
            className="hover:bg-accent hover:text-accent-foreground bg-accent rounded-md p-1 text-sm"
          >
            {app.info.name}
          </button>
        </>
      )}
    </div>
  );
}
