"use client";

import { useState, useEffect } from "react";
import { MarketplaceApp, listMarketplaceApps } from "@/lib/api/marketplace";
import { AppCard } from "./app-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toolbar } from "@/components/ui/toolbar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, Plus } from "lucide-react";
import { submitBugReport } from "@/lib/api/bug-report";
import { APP_VERSION } from "@/lib/version";
import { toast } from "@/hooks/use-toast";
import { useBreadcrumbStore } from "@/stores";
import { MarketplaceBreadcrumb } from "./marketplace-breadcrumb";

interface AppListProps {
  onSelectApp: (appId: string) => void;
  onActionClick?: (appId: string) => void;
}

export function AppList({ onSelectApp, onActionClick }: AppListProps) {
  const [apps, setApps] = useState<MarketplaceApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setBreadcrumb, clearBreadcrumb } = useBreadcrumbStore();

  useEffect(() => {
    setBreadcrumb(<MarketplaceBreadcrumb />);
    return () => clearBreadcrumb();
  }, [setBreadcrumb, clearBreadcrumb]);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const response = await listMarketplaceApps();
        setApps(response.apps);
      } catch (error) {
        console.error("Failed to fetch marketplace apps:", error);
        toast({
          icon: "❌",
          title: "Failed to load marketplace",
          description: "Please try refreshing the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchApps();
  }, []);

  const handlePublishSubmit = async () => {
    if (!repoUrl.trim()) return;

    setIsSubmitting(true);

    try {
      const os = navigator.platform;
      const arch = navigator.userAgent.includes("x86_64") ? "amd64" : "arm64";

      await submitBugReport({
        title: "Marketplace app publish request",
        description: `Repository URL: ${repoUrl}\n\nThis is a request to publish an app to the marketplace. Please review the repository and approve if it meets the guidelines.`,
        version: APP_VERSION,
        os,
        arch,
      });

      toast({
        icon: "🎉",
        title: "Submission Received!",
        description:
          "Thank you for your submission. Our team will review your app and get back to you soon.",
        variant: "default",
      });

      setRepoUrl("");
      setIsPublishDialogOpen(false);
    } catch (error) {
      console.error("Error submitting publish request:", error);
      toast({
        icon: "❌",
        title: "Failed to submit request",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTabButtonClassNames = (tab: string) =>
    activeTab === tab
      ? "hover:text-muted-foreground h-auto px-3 py-1 bg-background text-foreground hover:bg-background hover:text-foreground shadow-sm"
      : "hover:text-muted-foreground h-auto px-3 py-1";

  const getSortedApps = (tab: string) => {
    const sortedApps = [...apps];

    switch (tab) {
      case "popular":
        return sortedApps.sort((a, b) => b.stars - a.stars);
      case "recent":
        return sortedApps.sort((a, b) => {
          if (!a.lastUpdated && !b.lastUpdated) return 0;
          if (!a.lastUpdated) return 1;
          if (!b.lastUpdated) return -1;
          return (
            new Date(b.lastUpdated).getTime() -
            new Date(a.lastUpdated).getTime()
          );
        });
      default:
        return sortedApps;
    }
  };

  const currentApps = getSortedApps(activeTab);

  // Filter apps based on search query
  const filteredApps = currentApps.filter(
    (app) =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading marketplace...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Toolbar
        leftSection={
          <div className="flex items-center gap-2">
            <div className="bg-muted text-muted-foreground inline-flex h-9 items-center justify-center rounded-lg p-1">
              <Button
                variant="ghost"
                className={getTabButtonClassNames("all")}
                onClick={() => setActiveTab("all")}
              >
                All
              </Button>
              <Button
                variant="ghost"
                className={getTabButtonClassNames("popular")}
                onClick={() => setActiveTab("popular")}
              >
                Popular
              </Button>
              <Button
                variant="ghost"
                className={getTabButtonClassNames("recent")}
                onClick={() => setActiveTab("recent")}
              >
                Recent
              </Button>
            </div>
          </div>
        }
      >
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

      <div className="flex-1 overflow-hidden">
        <div className="h-full flex-1 overflow-auto px-4 py-2">
          {filteredApps.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredApps.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  onClick={onSelectApp}
                  onActionClick={onActionClick}
                />
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground flex h-40 items-center justify-center">
              No apps found matching your search
            </div>
          )}
        </div>
      </div>

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
