"use client";

import {
  Star,
  MoreHorizontal,
  Trash2,
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import {
  type App,
  installApp,
  listApps,
  startApp,
  stopApp,
  uninstallApp,
} from "@/lib/api/apps";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { AppIcon } from "@/components/apps/app-icon";
import { cn } from "@/lib/utils";
import { useSidebarStore, useBreadcrumbStore } from "@/stores";
import { AppBreadcrumb } from "./apps-breadcrumb";

// Install form schema
const installFormSchema = z.object({
  repoURL: z.string().url("Must be a valid Git repository URL"),
  branch: z.string(),
  force: z.boolean(),
});
// Install form type - inferred from schema
type InstallFormValues = z.infer<typeof installFormSchema>;

interface AppListProps {
  onSelectApp: (appId: string) => void;
}

export function AppList({ onSelectApp }: AppListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [apps, setApps] = useState<App[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [reinstallingApps, setReinstallingApps] = useState<Set<string>>(
    new Set(),
  );

  const { favorites, addFavorite, removeFavorite } = useSidebarStore();
  const { setBreadcrumb, clearBreadcrumb } = useBreadcrumbStore();

  const installForm = useForm<InstallFormValues>({
    resolver: zodResolver(installFormSchema),
    defaultValues: {
      repoURL: "",
      branch: "main",
      force: false,
    },
  });

  useEffect(() => {
    setBreadcrumb(<AppBreadcrumb app={null} />);
    return () => clearBreadcrumb();
  }, [setBreadcrumb, clearBreadcrumb]);

  useEffect(() => {
    loadApps();

    // Set up interval to refresh apps every 5 seconds
    const refreshInterval = setInterval(() => {
      loadApps();
    }, 5000);

    // Clean up interval on component unmount
    return () => clearInterval(refreshInterval);
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

  const handleInstallSubmit = async (data: InstallFormValues) => {
    try {
      await installApp({
        repoURL: data.repoURL,
        branch: data.branch || undefined,
        force: data.force,
      });

      toast({
        icon: "🎉",
        title: "App Installed!",
        description: `The app ${data.repoURL.split("/").pop()} has been successfully installed.`,
        variant: "default",
      });

      installForm.reset();
      setIsInstallDialogOpen(false);
      await loadApps();
    } catch (error) {
      toast({
        icon: "❌",
        title: "Installation Failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleUninstallApp = async (appId: string) => {
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

      await loadApps();
    } catch (error) {
      toast({
        icon: "❌",
        title: "Uninstall Failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleReinstallApp = async (app: App) => {
    // Only git-based apps can be reinstalled
    if (app.info.source !== "git") {
      toast({
        icon: "❌",
        title: "Failed to reinstall app",
        description: `This is a ${app.info.source} app, only git apps can be reinstalled`,
        variant: "destructive",
      });
      return;
    }

    try {
      setReinstallingApps((prev) => new Set(prev).add(app.info.id));

      // Stop the app if it's currently running to ensure clean reinstallation
      if (app.status === "running") {
        await stopApp(app.info.id);
      }

      // Reinstall the app with force flag to overwrite existing files
      await installApp({
        repoURL: app.info.sourceURI,
        branch: app.info.branch,
        force: true, // Force overwrite existing installation
      });

      // Attempt to restart the app after successful reinstallation
      // We ignore restart errors as the user can manually start the app
      try {
        await startApp(app.info.id);
      } catch (restartError) {
        console.warn(
          `Failed to auto-restart app ${app.info.id}:`,
          restartError,
        );
        // Don't throw here - reinstallation was successful, just restart failed
      }

      // Refresh app data after a short delay to allow for state updates
      setTimeout(async () => {
        await loadApps();
        setReinstallingApps((prev) => {
          const newSet = new Set(prev);
          newSet.delete(app.info.id);
          return newSet;
        });
      }, 1000);

      // Show success message
      toast({
        icon: "✅",
        title: "App reinstalled",
        description: "App has been reinstalled successfully",
        variant: "default",
      });
    } catch (error) {
      console.error(`Failed to reinstall app ${app.info.id}:`, error);

      // Show error message with helpful context
      toast({
        icon: "❌",
        title: "Failed to reinstall app",
        description:
          (error instanceof Error ? error.message : "Unknown error occurred") +
          ". Please check the app's logs for more information.",
        variant: "destructive",
      });
    } finally {
      // Always reset the reinstalling state, even if there was an error
      setReinstallingApps((prev) => {
        const newSet = new Set(prev);
        newSet.delete(app.info.id);
        return newSet;
      });
    }
  };

  const handleFavoriteClick = (app: App, e: React.MouseEvent) => {
    e.stopPropagation();
    const isFavorited = favorites.some(
      (fav) => fav.id === app.info.id && fav.type === "app",
    );

    if (isFavorited) {
      removeFavorite(app.info.id);
    } else {
      addFavorite({
        id: app.info.id,
        name: app.info.name,
        type: "app",
      });
    }
  };

  const handleDragStart = (e: React.DragEvent, app: App) => {
    // Create a drag item with app data for the sidebar
    const dragItem = {
      id: app.info.id,
      name: app.info.name,
      type: "app" as const,
    };

    e.dataTransfer.setData("application/json", JSON.stringify(dragItem));
    e.dataTransfer.effectAllowed = "copy";
  };

  const getTabButtonClassNames = (tab: string) =>
    cn(
      "hover:text-muted-foreground h-auto px-3 py-1",
      activeTab === tab &&
        "bg-background text-foreground hover:bg-background hover:text-foreground shadow-sm",
    );

  // Filter apps based on search query
  const filteredApps = apps
    .filter((app) => {
      const matchesSearch = app.info.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        activeTab === "running"
          ? app.status === "running"
          : activeTab === "stopped"
            ? app.status === "stopped"
            : true;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => a.info.name.localeCompare(b.info.name));

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
                className={getTabButtonClassNames("running")}
                onClick={() => setActiveTab("running")}
              >
                Running
              </Button>
              <Button
                variant="ghost"
                className={getTabButtonClassNames("stopped")}
                onClick={() => setActiveTab("stopped")}
              >
                Stopped
              </Button>
            </div>
          </div>
        }
      >
        <div className="relative w-72">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
          <Input
            placeholder="Search installed apps..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsInstallDialogOpen(true)} className="gap-0">
          <Plus className="mr-2 h-4 w-4" />
          <span>Install App</span>
        </Button>
      </Toolbar>

      <div className="flex-1 overflow-hidden">
        <div className="h-full flex-1 overflow-auto px-4 py-2">
          {isLoading ? null : filteredApps.length > 0 ? (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full">
                <thead className="bg-muted text-muted-foreground text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left">Name</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">PID</th>
                    <th className="px-6 py-3 text-left">Port(s)</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredApps.map((app) => (
                    <tr
                      key={app.info.id}
                      className="hover:bg-muted/50 group cursor-pointer"
                      onClick={() => onSelectApp(app.info.id)}
                      draggable
                      onDragStart={(e) => handleDragStart(e, app)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <AppIcon name={app.info.name} />
                          <span className="font-medium">{app.info.name}</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-muted-foreground cursor-grab opacity-0 transition-opacity group-hover:opacity-100">
                                  <svg
                                    className="h-3 w-3"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zm6-8a2 2 0 1 1-.001-4.001A2 2 0 0 1 13 6zm0 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z" />
                                  </svg>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Drag to add to sidebar favorites</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className="border-green-200 bg-green-50 text-green-700"
                        >
                          {app.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-muted-foreground">
                          {app?.pid > 0 ? app.pid : "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-muted-foreground">
                          {app.ports.length > 0 ? app.ports.join(", ") : "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => handleFavoriteClick(app, e)}
                          >
                            <Star
                              className={cn(
                                "h-4 w-4",
                                favorites.some(
                                  (fav) =>
                                    fav.id === app.info.id &&
                                    fav.type === "app",
                                ) && "fill-current text-yellow-500",
                              )}
                            />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReinstallApp(app);
                                }}
                                disabled={reinstallingApps.has(app.info.id)}
                              >
                                <RefreshCcw className="h-4 w-4" />
                                {reinstallingApps.has(app.info.id)
                                  ? "Reinstalling..."
                                  : "Reinstall"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-500 focus:text-red-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUninstallApp(app.info.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                Uninstall
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 text-5xl">📦</div>
              {apps.length === 0 ? (
                <>
                  <h3 className="mb-2 text-lg font-medium">
                    No Apps Installed
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    You haven&apos;t installed any apps yet. Install an app to
                    get started.
                  </p>
                  <Button onClick={() => setIsInstallDialogOpen(true)}>
                    Install App
                  </Button>
                </>
              ) : (
                filteredApps.length === 0 && (
                  <>
                    <h3 className="mb-2 text-lg font-medium">No Apps Found</h3>
                    <p className="text-muted-foreground mb-4">
                      No apps match your filter criteria. Click the button below
                      to view all installed apps.
                    </p>
                    <Button
                      onClick={() => {
                        setSearchQuery("");
                        setActiveTab("all");
                      }}
                    >
                      View All Apps
                    </Button>
                  </>
                )
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isInstallDialogOpen} onOpenChange={setIsInstallDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Install App</DialogTitle>
          </DialogHeader>

          <Form {...installForm}>
            <form
              onSubmit={installForm.handleSubmit(handleInstallSubmit)}
              className="space-y-4"
            >
              <div className="space-y-4 py-4">
                <p className="text-sm">
                  Enter the Git repository URL of the app you want to install.
                </p>
                <div className="space-y-4">
                  <FormField
                    control={installForm.control}
                    name="repoURL"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Git Repository URL *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://github.com/username/repo"
                            autoComplete="off"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="text-muted-foreground hover:text-foreground flex items-center text-sm"
                    >
                      {showAdvanced ? (
                        <ChevronUp className="mr-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="mr-1 h-4 w-4" />
                      )}
                      Advanced Options
                    </button>

                    {showAdvanced && (
                      <div className="mt-4 space-y-4 rounded-lg">
                        <FormField
                          control={installForm.control}
                          name="branch"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Branch</FormLabel>
                              <FormControl>
                                <Input placeholder="main" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={installForm.control}
                          name="force"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  className="my-0 h-4 w-4 rounded border-gray-300"
                                  checked={field.value}
                                  onChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="!mt-0">
                                Force Install (overwrite if exists)
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsInstallDialogOpen(false)}
                  disabled={installForm.formState.isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    installForm.formState.isSubmitting ||
                    !installForm.formState.isValid
                  }
                >
                  {installForm.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Installing...
                    </>
                  ) : (
                    "Install App"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
