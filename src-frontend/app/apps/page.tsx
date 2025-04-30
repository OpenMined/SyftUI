"use client";

import { useQueryState } from "nuqs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppWindow, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppDetail } from "@/components/app/app-detail";
import { AppList } from "@/components/app/app-list";
import { mockApps } from "@/lib/mock-apps";
import { Toolbar } from "@/components/ui/toolbar";
import { AnnouncementBar } from "@/components/ui/announcement-bar";

export default function AppsPage() {
  const router = useRouter();
  const [selectedApp] = useQueryState("id");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter to only show installed apps
  const installedApps = mockApps.filter((app) => app.installed);

  const handleUninstallApp = (appId: string) => {
    // Logic to uninstall the app would go here
    console.log(`Uninstalling app with id: ${appId}`);
  };

  if (selectedApp) {
    return (
      <AppDetail appId={selectedApp} onBack={() => router.push("/apps")} />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <AnnouncementBar variant="warning">
        This is a mocked version of the apps page. The real version with full
        functionality is coming soon.
      </AnnouncementBar>
      <Toolbar title="Apps" icon={<AppWindow className="h-5 w-5" />}>
        <div className="relative w-72">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
          <Input
            placeholder="Search installed apps..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/marketplace")}
          className="gap-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span>Add App</span>
        </Button>
      </Toolbar>

      <Tabs defaultValue="all" className="flex-1">
        <div className="overflow-x-auto border-b px-4 py-2">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="recent">Recently Used</TabsTrigger>
            <TabsTrigger value="favorite">Favorites</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="h-full flex-1 p-0">
          {installedApps.length > 0 ? (
            <AppList
              apps={installedApps}
              onSelectApp={(appId) => router.push(`/apps?id=${appId}`)}
              onActionClick={handleUninstallApp}
              searchQuery={searchQuery}
              viewContext="apps"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 text-5xl">📦</div>
              <h3 className="mb-2 text-lg font-medium">No Apps Installed</h3>
              <p className="text-muted-foreground mb-4">
                You haven&apos;t installed any apps yet. Visit the marketplace
                to find and install apps.
              </p>
              <Button onClick={() => router.push("/marketplace")}>
                Browse Marketplace
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="flex-1 p-0">
          <div className="text-muted-foreground flex h-40 items-center justify-center">
            Your recently used apps will appear here
          </div>
        </TabsContent>

        <TabsContent value="favorite" className="flex-1 p-0">
          <div className="text-muted-foreground flex h-40 items-center justify-center">
            Your favorite apps will appear here
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
