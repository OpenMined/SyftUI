"use client";

import { useQueryState } from "nuqs";
import { useRouter } from "next/navigation";
import { AppList } from "@/components/apps/app-list";
import { AppDetail } from "@/components/apps/app-detail";
import { toast } from "@/hooks/use-toast";
import { uninstallApp } from "@/lib/api/apps";

export default function AppsPage() {
  const router = useRouter();
  const [selectedApp] = useQueryState("id");

  const handleUninstallApp = async (appId: string): Promise<boolean> => {
    const appName = appId.split(".").pop();
    try {
      toast({
        icon: "🗑️",
        title: "Uninstalling...",
        description: `Uninstalling ${appName}...`,
      });

      await uninstallApp(appId);

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
      appId={selectedApp}
      onUninstall={() => handleUninstallApp(selectedApp)}
      onBack={() => router.push("/apps")}
    />
  ) : (
    <AppList
      onSelectApp={(appId) => router.push(`/apps?id=${appId}`)}
      onUninstall={handleUninstallApp}
    />
  );
}
