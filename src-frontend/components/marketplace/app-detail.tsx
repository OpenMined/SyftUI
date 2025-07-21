"use client";

import { useState, useEffect, useCallback } from "react";
import { ReviewDialog } from "./review-dialog";
import { ChevronLeft, Star, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import type { SyntaxHighlighterProps } from "react-syntax-highlighter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Toolbar } from "@/components/ui/toolbar";
import { type MarketplaceApp, getMarketplaceApp } from "@/lib/api/marketplace";
import { installApp, uninstallApp } from "@/lib/api/apps";
import { toast } from "@/hooks/use-toast";
import { useOpenPath } from "@/hooks/use-open-path";
import { useBreadcrumbStore } from "@/stores";
import { MarketplaceBreadcrumb } from "./marketplace-breadcrumb";

import { getAssetPath } from "@/lib/utils";
import Image from "next/image";
import remarkGfm from "remark-gfm";
import { useRouter, useSearchParams } from "next/navigation";
import { Separator } from "@radix-ui/react-separator";

interface AppDetailProps {
  appId: string;
  onBack: () => void;
}

// const viewsData = Array.from({ length: 30 }, (_, i) => {
//   // Create date for each of the past 30 days, starting from today and going backward
//   const date = new Date();
//   date.setDate(date.getDate() - (29 - i));

//   // Format the date as MM/DD/YYYY
//   const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}/${date.getFullYear()}`;

//   // Generate realistic view counts with some variability (base: 800-1200, with random fluctuations)
//   const baseViews = Math.floor(Math.random() * 400) + 800;
//   // Add a trend that increases over time (multiplier increases slightly for more recent days)
//   const trendMultiplier = 1 + i / 30;
//   // Add some randomness to create peaks and valleys
//   const randomFactor = Math.random() * 0.4 + 0.8; // between 0.8 and 1.2

//   return {
//     date: formattedDate,
//     views: Math.floor(baseViews * trendMultiplier * randomFactor),
//   };
// });

// const yearlyActivityData = [
//   { month: "Jan", activity: 120 },
//   { month: "Feb", activity: 150 },
//   { month: "Mar", activity: 180 },
//   { month: "Apr", activity: 200 },
//   { month: "May", activity: 220 },
//   { month: "Jun", activity: 250 },
//   { month: "Jul", activity: 280 },
//   { month: "Aug", activity: 300 },
//   { month: "Sep", activity: 280 },
//   { month: "Oct", activity: 250 },
//   { month: "Nov", activity: 220 },
//   { month: "Dec", activity: 200 },
// ];

export function AppDetail({ appId, onBack }: AppDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [app, setApp] = useState<MarketplaceApp | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUninstalling, setIsUninstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const { setBreadcrumb, clearBreadcrumb } = useBreadcrumbStore();
  const { openPath } = useOpenPath();

  const handleInstall = useCallback(async () => {
    if (!app || !app.repository) {
      toast({
        icon: "❌",
        title: "Installation Failed",
        description: "App repository URL is not available",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Show loading toast
      toast({
        icon: app.icon || "📦",
        title: "Installing app",
        description: `Installing ${app.name}...`,
      });

      // Install app using repository URL
      await installApp({
        repoURL: app.repository,
        branch: app.branch || "main",
        force: false,
      });

      // Success toast
      toast({
        icon: "🎉",
        title: "App Installed!",
        description: `${app.name} has been successfully installed.`,
        variant: "default",
      });

      setIsInstalled(true);
    } catch (error) {
      console.error("Failed to install app:", error);

      toast({
        icon: "❌",
        title: "Installation Failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [app]);

  const handleUninstall = useCallback(async () => {
    if (!app) return;

    setIsUninstalling(true);
    const appName = app.name;

    try {
      toast({
        icon: "🗑️",
        title: "Uninstalling...",
        description: `Uninstalling ${appName}...`,
      });

      await uninstallApp(app.id);

      toast({
        icon: "🗑️",
        title: "App uninstalled",
        description: `${appName} has been uninstalled.`,
      });

      setIsInstalled(false);
    } catch (error) {
      toast({
        icon: "❌",
        title: "Uninstall Failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUninstalling(false);
    }
  }, [app]);

  useEffect(() => {
    const fetchApp = async () => {
      try {
        const fetchedApp = await getMarketplaceApp(appId);
        setApp(fetchedApp);
        setIsInstalled(fetchedApp.installed);
      } catch (error) {
        console.error("Failed to fetch app:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApp();
  }, [appId]);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "install" && app && !isInstalled && !isProcessing) {
      // Automatically trigger installation
      handleInstall();
    }
  }, [searchParams, app, isInstalled, isProcessing, handleInstall]);

  useEffect(() => {
    setBreadcrumb(<MarketplaceBreadcrumb app={app} />);
    return () => clearBreadcrumb();
  }, [setBreadcrumb, clearBreadcrumb, app]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading app details...</div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">App not found</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Toolbar
        title="App Details"
        icon={
          <ChevronLeft className="h-4 w-4 cursor-pointer" onClick={onBack} />
        }
      >
        {!isInstalled ? (
          <Button onClick={handleInstall} disabled={isProcessing}>
            {isProcessing ? "Installing..." : "Install"}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              onClick={() => {
                router.push(`/apps/?id=${app.id}`);
              }}
            >
              Open App
            </Button>
            <Button
              variant="outline"
              className="border-destructive text-destructive hover:text-destructive hover:bg-none"
              onClick={handleUninstall}
              disabled={isUninstalling}
            >
              {isUninstalling ? "Uninstalling..." : "Uninstall App"}
            </Button>
          </div>
        )}
      </Toolbar>

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">
            <div className="mb-6 flex flex-col gap-4 md:flex-row">
              <div className="text-5xl md:text-6xl">{app.icon}</div>
              <div className="flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold">{app.name}</h2>
                </div>
                <p className="text-muted-foreground mb-2">{app.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center">
                    <Star className="mr-1 h-4 w-4 text-yellow-500" />
                    {app.stars} stars
                  </div>
                  <div>
                    <span className="text-muted-foreground">by </span>
                    <span className="font-medium">{app.author}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator orientation="horizontal" />

            {/* <Tabs defaultValue="details">
              <TabsList className="mb-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="changelog">Changelog</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4"> */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-6">
              <div className="col-span-2">
                <h3 className="mb-2 border-b border-gray-200 pb-2 text-lg font-medium">
                  Overview
                </h3>
                <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
                  {app.longDescription ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({
                          className,
                          children,
                          ...props
                        }: React.ComponentProps<"code">) {
                          const match = /language-(\w+)/.exec(className || "");
                          return match ? (
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              {...(props as SyntaxHighlighterProps)}
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {app.longDescription}
                    </ReactMarkdown>
                  ) : (
                    <p>{app.description}</p>
                  )}
                </div>
              </div>

              <div className="lg:w-80 lg:pl-6">
                <h3 className="mb-2 border-b border-gray-200 pb-2 text-lg font-medium">
                  Details
                </h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {app.version && (
                    <>
                      <dt className="text-muted-foreground">Version</dt>
                      <dd>{app.version}</dd>
                    </>
                  )}

                  {app.lastUpdated && (
                    <>
                      <dt className="text-muted-foreground">Last Updated</dt>
                      <dd>{app.lastUpdated}</dd>
                    </>
                  )}

                  {app.license && (
                    <>
                      <dt className="text-muted-foreground">License</dt>
                      <dd>{app.license}</dd>
                    </>
                  )}

                  <dt className="text-muted-foreground">Categories</dt>
                  <dd className="flex flex-wrap gap-1">
                    {app.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </dd>

                  {(app.website || app.repository) && (
                    <>
                      <dt className="text-muted-foreground">Links</dt>
                      <dd className="flex flex-wrap gap-2">
                        {app.website && (
                          <button
                            onClick={() => openPath(app.website!)}
                            className="flex items-center text-blue-600 hover:underline"
                          >
                            Website <ExternalLink className="ml-1 h-3 w-3" />
                          </button>
                        )}
                        {app.repository && (
                          <button
                            onClick={() => openPath(app.repository!)}
                            className="flex items-center text-blue-600 hover:underline"
                          >
                            Repository <ExternalLink className="ml-1 h-3 w-3" />
                          </button>
                        )}
                      </dd>
                    </>
                  )}
                </dl>
              </div>
            </div>

            {app.screenshots && app.screenshots.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 border-b border-gray-200 pb-2 text-lg font-medium">
                  Screenshots
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {app.screenshots.map((screenshot, index) => (
                    <Image
                      key={index}
                      src={screenshot || getAssetPath("/placeholder.svg")}
                      width={600}
                      height={400}
                      alt={`${app.name} screenshot ${index + 1}`}
                      className="aspect-video w-full rounded-md border object-cover"
                    />
                  ))}
                </div>
              </div>
            )}
            {/* </TabsContent>

              <TabsContent value="reviews">
                {app.reviews && app.reviews.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-bold">
                        {(
                          app.reviews.reduce(
                            (acc, review) => acc + review.rating,
                            0,
                          ) / app.reviews.length
                        ).toFixed(1)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-5 w-5 ${
                                star <=
                                app.reviews.reduce(
                                  (acc, review) => acc + review.rating,
                                  0,
                                ) /
                                  app.reviews.length
                                  ? "text-yellow-500"
                                  : "text-gray-300"
                              }`}
                              fill={
                                star <=
                                app.reviews.reduce(
                                  (acc, review) => acc + review.rating,
                                  0,
                                ) /
                                  app.reviews.length
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                          ))}
                          <span className="text-muted-foreground ml-2 text-sm">
                            Based on {app.reviews.length} reviews
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setReviewDialogOpen(true)}
                      >
                        Write a Review
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {app.reviews.map((review) => (
                        <div key={review.id} className="rounded-lg border p-4">
                          <div className="mb-2 flex justify-between">
                            <div className="font-medium">{review.author}</div>
                            <div className="text-muted-foreground text-sm">
                              {review.date}
                            </div>
                          </div>
                          <div className="mb-2 flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${star <= review.rating ? "text-yellow-500" : "text-gray-300"}`}
                                fill={
                                  star <= review.rating
                                    ? "currentColor"
                                    : "none"
                                }
                              />
                            ))}
                          </div>
                          <p className="text-sm">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground flex h-40 items-center justify-center">
                    No reviews available for this app
                  </div>
                )}
              </TabsContent>

              <TabsContent value="changelog">
                <div className="space-y-4">
                  <div className="ml-4 border-l-2 border-blue-500 pl-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">
                        Version {app.version || "1.0.0"}
                      </h3>
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                        Latest
                      </span>
                    </div>
                    <p className="text-muted-foreground mb-1 text-sm">
                      Released on {app.lastUpdated || "January 1, 2024"}
                    </p>
                    <ul className="list-inside list-disc space-y-1 text-sm">
                      <li>Fixed bug in data export functionality</li>
                      <li>Improved performance for large datasets</li>
                      <li>Added new visualization options</li>
                    </ul>
                  </div>

                  <div className="ml-4 border-l-2 border-gray-300 pl-4">
                    <h3 className="font-medium">
                      Version{" "}
                      {app.version
                        ? Number.parseFloat(app.version) - 0.1
                        : "0.9.0"}
                    </h3>
                    <p className="text-muted-foreground mb-1 text-sm">
                      Released on November 5, 2023
                    </p>
                    <ul className="list-inside list-disc space-y-1 text-sm">
                      <li>Added support for CSV and Excel import/export</li>
                      <li>New dark mode theme</li>
                      <li>Performance improvements</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="analytics"
                className="flex flex-col space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">
                      Views over the last 30 days
                    </CardTitle>
                    <CardDescription>
                      Daily view count for the application
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <div className="h-full w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={viewsData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 12 }}
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="views"
                              name="Views"
                              stroke="#1e88e5"
                              strokeWidth={2}
                              dot={{ r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col gap-4 lg:flex-row">
                  <Card className="flex-1">
                    <CardHeader>
                      <CardTitle className="text-xl">
                        Last Year Activity
                      </CardTitle>
                      <CardDescription>Monthly activity trends</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <div className="h-full w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={yearlyActivityData}
                              margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 25,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="month"
                                tick={{ fontSize: 12 }}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                              />
                              <YAxis allowDecimals={false} />
                              <Tooltip />
                              <Bar
                                dataKey="activity"
                                name="Activity"
                                fill="#43a047"
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs> */}
          </div>
        </div>
      </div>

      {/* Review Dialog */}
      <ReviewDialog
        appName={app.name}
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        onSubmit={(rating, reviewText) => {
          console.log(
            `New review for ${app.name}: ${rating} stars - ${reviewText}`,
          );
          // In a real app, we would update the reviews list here
        }}
      />
    </div>
  );
}
