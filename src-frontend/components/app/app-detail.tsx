"use client";

import { useState } from "react";
import { ReviewDialog } from "./review-dialog";
import {
  ChevronLeft,
  Star,
  Download,
  ExternalLink,
  Code,
  Shield,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Toolbar } from "@/components/ui/toolbar";
import { type App, mockApps } from "@/lib/mock-apps";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  Tooltip,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAssetPath } from "@/lib/utils";
import Image from "next/image";

interface AppDetailProps {
  appId: string;
  onBack: () => void;
}

const viewsData = Array.from({ length: 30 }, (_, i) => {
  // Create date for each of the past 30 days, starting from today and going backward
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));

  // Format the date as MM/DD/YYYY
  const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}/${date.getFullYear()}`;

  // Generate realistic view counts with some variability (base: 800-1200, with random fluctuations)
  const baseViews = Math.floor(Math.random() * 400) + 800;
  // Add a trend that increases over time (multiplier increases slightly for more recent days)
  const trendMultiplier = 1 + i / 30;
  // Add some randomness to create peaks and valleys
  const randomFactor = Math.random() * 0.4 + 0.8; // between 0.8 and 1.2

  return {
    date: formattedDate,
    views: Math.floor(baseViews * trendMultiplier * randomFactor),
  };
});

const yearlyActivityData = [
  { month: "Jan", activity: 120 },
  { month: "Feb", activity: 150 },
  { month: "Mar", activity: 180 },
  { month: "Apr", activity: 200 },
  { month: "May", activity: 220 },
  { month: "Jun", activity: 250 },
  { month: "Jul", activity: 280 },
  { month: "Aug", activity: 300 },
  { month: "Sep", activity: 280 },
  { month: "Oct", activity: 250 },
  { month: "Nov", activity: 220 },
  { month: "Dec", activity: 200 },
];

const securityData = {
  total: 4,
  severity: [
    { level: "Critical", count: 1, color: "bg-red-600" },
    { level: "High", count: 1, color: "bg-orange-500" },
    { level: "Medium", count: 1, color: "bg-yellow-500" },
    { level: "Low", count: 1, color: "bg-green-500" },
  ],
  lastScan: "2024-02-15",
};

export function AppDetail({ appId, onBack }: AppDetailProps) {
  const app = mockApps.find((a) => a.id === appId) as App;

  const [isProcessing, setIsProcessing] = useState(false);
  const [isInstalled, setIsInstalled] = useState(app.installed);
  const [isEnabled, setIsEnabled] = useState(app.enabled);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(app.autoUpdate);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [securityReportOpen, setSecurityReportOpen] = useState(false);

  const handleInstall = () => {
    setIsProcessing(true);

    // Simulate installation
    setTimeout(() => {
      setIsProcessing(false);
      setIsInstalled(true);
    }, 1500);
  };

  const handleUninstall = () => {
    setIsProcessing(true);

    // Simulate uninstallation process
    setTimeout(() => {
      setIsProcessing(false);
      setIsInstalled(false);
    }, 2000);
  };

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
            <div className="mr-2 flex items-center gap-2">
              <Switch
                id="auto-update"
                checked={autoUpdateEnabled}
                onCheckedChange={setAutoUpdateEnabled}
              />
              <Label htmlFor="auto-update" className="cursor-pointer text-sm">
                Auto-update
              </Label>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsEnabled(!isEnabled)}
              disabled={isProcessing}
            >
              {isEnabled ? "Disable" : "Enable"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleUninstall}
              disabled={isProcessing}
            >
              {isProcessing ? "Uninstalling..." : "Uninstall"}
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
                  {app.verified && (
                    <Badge
                      variant="outline"
                      className="border-blue-200 bg-blue-50 text-blue-600"
                    >
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mb-2">{app.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center">
                    <Star className="mr-1 h-4 w-4 text-yellow-500" />
                    {app.stars} stars
                  </div>
                  <div className="flex items-center">
                    <Download className="mr-1 h-4 w-4" />
                    {app.downloads.toLocaleString()} downloads
                  </div>
                  <div>
                    <span className="text-muted-foreground">by </span>
                    <span className="font-medium">
                      {app.publisher || app.author}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Tabs defaultValue="details">
              <TabsList className="mb-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="changelog">Changelog</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-6">
                  <div className="col-span-2">
                    <h3 className="mb-2 text-lg font-medium">Description</h3>
                    <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
                      {app.longDescription ? (
                        <ReactMarkdown
                          components={{
                            code({ inline, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(
                                className || "",
                              );
                              return !inline && match ? (
                                <SyntaxHighlighter
                                  style={vscDarkPlus}
                                  language={match[1]}
                                  PreTag="div"
                                  {...props}
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

                  <div className="lg:w-80 lg:border-l lg:pl-6">
                    <h3 className="mb-2 text-lg font-medium">Details</h3>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      {app.version && (
                        <>
                          <dt className="text-muted-foreground">Version</dt>
                          <dd>{app.version}</dd>
                        </>
                      )}

                      {app.lastUpdated && (
                        <>
                          <dt className="text-muted-foreground">
                            Last Updated
                          </dt>
                          <dd>{app.lastUpdated}</dd>
                        </>
                      )}

                      {app.license && (
                        <>
                          <dt className="text-muted-foreground">License</dt>
                          <dd>{app.license}</dd>
                        </>
                      )}

                      {app.pricing && (
                        <>
                          <dt className="text-muted-foreground">Pricing</dt>
                          <dd>{app.pricing}</dd>
                        </>
                      )}

                      <dt className="text-muted-foreground">Categories</dt>
                      <dd className="flex flex-wrap gap-1">
                        {app.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </dd>

                      {(app.website || app.repository) && (
                        <>
                          <dt className="text-muted-foreground">Links</dt>
                          <dd className="flex flex-wrap gap-2">
                            {app.website && (
                              <a
                                href={app.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-blue-600 hover:underline"
                              >
                                Website{" "}
                                <ExternalLink className="ml-1 h-3 w-3" />
                              </a>
                            )}
                            {app.repository && (
                              <a
                                href={app.repository}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-blue-600 hover:underline"
                              >
                                Repository{" "}
                                <ExternalLink className="ml-1 h-3 w-3" />
                              </a>
                            )}
                          </dd>
                        </>
                      )}
                    </dl>

                    {/* Security report */}
                    <div className="my-8">
                      <div className="flex items-center justify-between">
                        <h4 className="mb-2 text-lg font-medium">
                          Security Report
                        </h4>
                        <AlertCircle className="text-muted-foreground h-4 w-4" />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold">
                              {securityData.total}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              vulnerabilities found
                            </p>
                          </div>
                          <div className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white">
                            F
                          </div>
                        </div>

                        <div className="space-y-2">
                          {securityData.severity.map((item) => (
                            <div
                              key={item.level}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`h-4 w-4 ${item.color} rounded-sm`}
                                ></div>
                                <span className="text-sm">{item.level}</span>
                              </div>
                              <span className="font-medium">{item.count}</span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-1">
                          <p className="text-muted-foreground text-xs">
                            LAST SCAN: {securityData.lastScan}
                          </p>
                        </div>

                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setSecurityReportOpen(true)}
                        >
                          OPEN FULL REPORT
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {app.screenshots && app.screenshots.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-lg font-medium">Screenshots</h3>
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
              </TabsContent>

              <TabsContent value="features">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Code className="h-5 w-5 text-blue-500" />
                      <h3 className="font-medium">Developer Tools</h3>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Powerful tools for developers to analyze and transform
                      data with custom scripts.
                    </p>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-500" />
                      <h3 className="font-medium">Data Security</h3>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      End-to-end encryption and secure data handling to protect
                      your sensitive information.
                    </p>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-purple-500" />
                      <h3 className="font-medium">Collaboration</h3>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Real-time collaboration features for team analysis and
                      decision making.
                    </p>
                  </div>
                </div>
              </TabsContent>

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
                {/* Views over the last 30 days */}
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
                  {/* Last year activity */}
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

                  {/* Security report */}
                  <Card className="flex-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-base font-medium">
                        Security Report
                      </CardTitle>
                      <AlertCircle className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold">
                              {securityData.total}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              vulnerabilities found
                            </p>
                          </div>
                          <div className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white">
                            F
                          </div>
                        </div>

                        <div className="space-y-2">
                          {securityData.severity.map((item) => (
                            <div
                              key={item.level}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <div className={`h-4 w-4 ${item.color}`}></div>
                                <span className="text-sm">{item.level}</span>
                              </div>
                              <span className="font-medium">{item.count}</span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2">
                          <p className="text-muted-foreground text-xs">
                            LAST SCAN: {securityData.lastScan}
                          </p>
                        </div>

                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setSecurityReportOpen(true)}
                        >
                          OPEN FULL REPORT
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
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

      {/* Security Report Dialog */}
      <Dialog open={securityReportOpen} onOpenChange={setSecurityReportOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Security Report for {app.name}</DialogTitle>
            <DialogDescription>
              Detailed vulnerability assessment from latest scan on{" "}
              {securityData.lastScan}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted flex items-center justify-between rounded-md p-3">
              <div>
                <p className="text-2xl font-bold">{securityData.total}</p>
                <p className="text-muted-foreground text-sm">
                  Vulnerabilities found
                </p>
              </div>
              <div className="rounded bg-red-600 px-3 py-2 text-sm font-medium text-white">
                F
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">
                Vulnerabilities by Severity
              </h3>
              {securityData.severity.map((item) => (
                <div
                  key={item.level}
                  className="flex items-center justify-between border-b p-2"
                >
                  <div className="flex items-center gap-2">
                    <div className={`h-4 w-4 ${item.color} rounded-sm`}></div>
                    <span className="font-medium">{item.level}</span>
                  </div>
                  <span className="font-bold">{item.count}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">Critical Issues</h3>
              <div className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-red-600">
                    Dependency Vulnerability
                  </h4>
                  <Badge variant="destructive">Critical</Badge>
                </div>
                <p className="mt-1 text-sm">
                  Outdated package &ldquo;crypto-lib&rdquo; contains known
                  CVE-2023-4567
                </p>
                <Button size="sm" variant="outline" className="mt-2">
                  View Details
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">Remediation Steps</h3>
              <ul className="list-inside list-disc space-y-2 text-sm">
                <li>
                  Update dependency &ldquo;crypto-lib&rdquo; to version 2.4.0 or
                  later
                </li>
                <li>Implement proper input validation in API endpoints</li>
                <li>Fix insecure data storage in user settings module</li>
                <li>Enable content security policy headers</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setSecurityReportOpen(false)}
              >
                Close
              </Button>
              <Button>Download Full Report</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
