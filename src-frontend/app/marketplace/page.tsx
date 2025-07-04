"use client";

import { useQueryState } from "nuqs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppDetail } from "@/components/marketplace/app-detail";
import { AppList } from "@/components/marketplace/app-list";
import { publishedApps } from "@/lib/apps-data";
import { Toolbar } from "@/components/ui/toolbar";
import { toast } from "@/hooks/use-toast";
import { Suspense } from "react";

function MarketplacePageContent() {
  const router = useRouter();
  const [selectedApp] = useQueryState("id");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePublishSubmit = () => {
    if (!repoUrl.trim()) return;

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);

      toast({
        icon: "🎉",
        title: "Submission Received!",
        description:
          "Thank you for your submission. Our team will review your app and get back to you soon.",
        variant: "default",
      });

      // Reset and close dialog immediately
      setRepoUrl("");
      setIsPublishDialogOpen(false);
    }, 1500);
  };

  const handleAppInstall = (appId: string) => {
    // Find the app in the mock data
    const appIndex = publishedApps.findIndex((app) => app.id === appId);
    if (appIndex !== -1) {
      // Toggle the installed state in our copy of the data
      // Note: In a real application, this would be managed by a state management solution
      // or would involve API calls to actually install/uninstall the app
      const updatedApps = [...publishedApps];
      updatedApps[appIndex] = {
        ...updatedApps[appIndex],
        installed: !updatedApps[appIndex].installed,
      };

      // The app card component now handles its own state independently
      // This function is now primarily for logging or backend integration
      console.log(
        `${updatedApps[appIndex].installed ? "Installing" : "Uninstalling"} app with id: ${appId}`,
      );
    }
  };

  if (selectedApp) {
    return (
      <AppDetail
        appId={selectedApp}
        onBack={() => router.push("/marketplace")}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Toolbar title="Marketplace" icon={<ShoppingBag className="h-5 w-5" />}>
        <div className="relative w-72">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
          <Input
            placeholder="Search apps..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsPublishDialogOpen(true)} className="gap-0">
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Publish App</span>
        </Button>
      </Toolbar>

      <Tabs defaultValue="all" className="flex-1">
        <div className="overflow-x-auto border-b px-4 py-2">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="recommended">Recommended</TabsTrigger>
            <TabsTrigger value="popular">Popular</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="flex-1 p-0">
          <AppList
            apps={publishedApps}
            onSelectApp={(appId) => router.push(`/marketplace?id=${appId}`)}
            onActionClick={handleAppInstall}
            searchQuery={searchQuery}
            viewContext="marketplace"
          />
        </TabsContent>

        <TabsContent value="recommended" className="flex-1 p-0">
          <div className="text-muted-foreground flex h-40 items-center justify-center">
            Recommendations will appear here based on your usage
          </div>
        </TabsContent>

        <TabsContent value="popular" className="flex-1 p-0">
          <div className="text-muted-foreground flex h-40 items-center justify-center">
            Loading popular apps...
          </div>
        </TabsContent>

        <TabsContent value="recent" className="flex-1 p-0">
          <div className="text-muted-foreground flex h-40 items-center justify-center">
            Loading recently added and updated apps...
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Publish App</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="mb-4 text-sm">
              Submit your GitHub repository URL to publish your app to the
              marketplace. Our team will review your submission and approve it
              if it meets our guidelines.
            </p>
            <div className="space-y-2">
              <label htmlFor="repo-url" className="text-sm font-medium">
                Public GitHub Repository URL
              </label>
              <Input
                id="repo-url"
                placeholder="https://github.com/username/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                Make sure your repository is a valid SyftBox app and includes a
                valid run.sh file
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPublishDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePublishSubmit}
              disabled={isSubmitting || !repoUrl.trim()}
            >
              {isSubmitting ? "Submitting..." : "Submit for Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MarketplacePageContent />
    </Suspense>
  );
}
