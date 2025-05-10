"use client";

import { useQueryState } from "nuqs";
import { useRouter } from "next/navigation";
import { AppList } from "@/components/apps/app-list";
import { AppDetail } from "@/components/apps/app-detail";
import { toast } from "@/hooks/use-toast";
import { uninstallApp } from "@/lib/api/apps";

export default function AppsPage() {
  const router = useRouter();
  const [selectedApp] = useQueryState("name");

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
      appName={selectedApp}
      onUninstall={() => handleUninstallApp(selectedApp)}
      onBack={() => router.push("/apps")}
    />
  ) : (
    <AppList
      onSelectApp={(appName) => router.push(`/apps?name=${appName}`)}
      onUninstall={handleUninstallApp}
    />
  );
}
