"use client";

import {
  Star,
  MoreHorizontal,
  Trash2,
  AppWindow,
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toolbar } from "@/components/ui/toolbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { toast } from "@/hooks/use-toast";
import { installApp, listApps } from "@/lib/api/apps";
import type { App } from "@/lib/api/apps";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { AppIcon } from "@/components/apps/app-icon";

// Install form schema
const installFormSchema = z
  .object({
    repoURL: z.string().url("Must be a valid Git repository URL"),
    branch: z.string().optional(),
    tag: z.string().optional(),
    commit: z.string().optional(),
    force: z.boolean().default(false),
  })
  .refine((data) => data.branch || data.tag || data.commit, {
    message: "At least one of branch, tag, or commit must be provided",
    path: ["repoURL"],
  });

// Install form type
type InstallFormValues = z.infer<typeof installFormSchema>;

interface AppListProps {
  onSelectApp: (appId: string) => void;
  onUninstall: (appId: string) => Promise<boolean>;
}

export function AppList({ onSelectApp, onUninstall }: AppListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [apps, setApps] = useState<App[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const installForm = useForm<InstallFormValues>({
    resolver: zodResolver(installFormSchema),
    defaultValues: {
      repoURL: "",
      branch: "main",
      tag: "",
      commit: "",
      force: false,
    },
  });

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      const apps = await listApps();
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
        tag: data.tag || undefined,
        commit: data.commit || undefined,
        force: data.force,
      });

      toast({
        icon: "🎉",
        title: "App Installed!",
        description: `The app ${data.repoURL} has been successfully installed.`,
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

  const handleUninstallApp = async (appName: string) => {
    const uninstalled = await onUninstall(appName);
    if (uninstalled) await loadApps();
  };

  // Filter apps based on search query
  const filteredApps = apps.filter((app) =>
    app.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex h-full flex-col">
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
        <Button onClick={() => setIsInstallDialogOpen(true)} className="gap-0">
          <Plus className="mr-2 h-4 w-4" />
          <span>Install App</span>
        </Button>
      </Toolbar>

      <Tabs defaultValue="all" className="flex-1">
        <div className="overflow-x-auto border-b px-4 py-2">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="running">Running</TabsTrigger>
            <TabsTrigger value="favorite">Favorites</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="h-full flex-1 px-4 py-2">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-muted-foreground">Loading apps...</p>
            </div>
          ) : filteredApps.length > 0 ? (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full">
                <thead className="bg-muted/40 text-muted-foreground text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left">Name</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredApps.map((appName, index) => (
                    <tr
                      key={index}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => onSelectApp(appName)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <AppIcon name={appName} />
                          <span className="font-medium">{appName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className="border-green-200 bg-green-50 text-green-700"
                        >
                          Running
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Star className="h-4 w-4" />
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
                                className="text-red-500 focus:text-red-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUninstallApp(appName);
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
              <h3 className="mb-2 text-lg font-medium">No Apps Installed</h3>
              <p className="text-muted-foreground mb-4">
                You haven&apos;t installed any apps yet. Install an app to get
                started.
              </p>
              <Button onClick={() => setIsInstallDialogOpen(true)}>
                Install App
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="running" className="flex-1 p-0">
          <div className="text-muted-foreground flex h-40 items-center justify-center">
            Your running apps will appear here
          </div>
        </TabsContent>

        <TabsContent value="favorite" className="flex-1 p-0">
          <div className="text-muted-foreground flex h-40 items-center justify-center">
            Your favorite apps will appear here
          </div>
        </TabsContent>
      </Tabs>

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
                        <div className="grid grid-cols-2 gap-4">
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
                            name="tag"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tag</FormLabel>
                                <FormControl>
                                  <Input placeholder="v1.0.0" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={installForm.control}
                          name="commit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Commit Hash</FormLabel>
                              <FormControl>
                                <Input placeholder="a1b2c3d..." {...field} />
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
