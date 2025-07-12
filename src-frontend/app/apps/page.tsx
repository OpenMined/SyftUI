"use client";

import { useQueryState } from "nuqs";
import { useRouter } from "next/navigation";
import { AppList } from "@/components/apps/app-list";
import { AppDetail } from "@/components/apps/app-detail";
import { toast } from "@/hooks/use-toast";
import { uninstallApp } from "@/lib/api/apps";
import { Suspense, useEffect } from "react";
import { useBreadcrumbStore } from "@/stores";
import { AppBreadcrumb } from "@/components/apps/breadcrumb";

function AppsPageContent() {
  const router = useRouter();
  const [selectedApp] = useQueryState("id");
  const { setBreadcrumb, clearBreadcrumb } = useBreadcrumbStore();

  useEffect(() => {
    setBreadcrumb(<AppBreadcrumb />);
    return () => clearBreadcrumb();
  }, [setBreadcrumb, clearBreadcrumb]);

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

export default function AppsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AppsPageContent />
    </Suspense>
  );
}
