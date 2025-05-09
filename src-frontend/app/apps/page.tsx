"use client";

import { useState, useEffect } from "react";
import { useQueryState } from "nuqs";
import { useRouter } from "next/navigation";
import { AppList } from "@/components/apps/app-list";
import { AppDetail } from "@/components/apps/app-detail";
import { toast } from "@/hooks/use-toast";
import { type App, listApps, uninstallApp } from "@/lib/api/apps";

export default function AppsPage() {
  const router = useRouter();
  const [selectedApp] = useQueryState("id");
  const [apps, setApps] = useState<App[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      const { apps } = await listApps();
      setApps(apps);
    } catch (error) {
      toast({
        icon: "❌",
        title: "Failed to load apps",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUninstallApp = async (appName: string): Promise<boolean> => {
    try {
      toast({
        icon: "🗑️",
        title: "Uninstalling...",
        description: `Uninstalling ${appName}...`,
      });

      await uninstallApp(appName);

      toast({
        icon: "🗑️",
        title: "App uninstalled",
        description: `${appName} has been uninstalled.`,
      });
      return true;
    } catch (error) {
      toast({
        icon: "❌",
        title: "Uninstall Failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      return false;
    }
  };

  return selectedApp ? (
    <AppDetail
      app={apps.find((app) => app.id === selectedApp)}
      isLoading={isLoading}
      onUninstall={() => handleUninstallApp(selectedApp)}
      onBack={() => router.push("/apps")}
    />
  ) : (
    <AppList
      apps={apps}
      isLoading={isLoading}
      onSelectApp={(appId) => router.push(`/apps?id=${appId}`)}
      onUninstall={handleUninstallApp}
    />
  );
}
