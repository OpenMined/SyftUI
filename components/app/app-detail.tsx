"use client"

import { useState } from "react"
import { ChevronLeft, Star, Download, ExternalLink, Heart, Share2, Code, Shield, MessageSquare } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Toolbar } from "@/components/ui/toolbar"
import { App, mockApps } from "@/lib/mock-apps"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface AppDetailProps {
  appId: string
  onBack: () => void
}

export function AppDetail({ appId, onBack }: AppDetailProps) {
  const app = mockApps.find(a => a.id === appId) as App;

  const [isProcessing, setIsProcessing] = useState(false);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(app.installed);

  const handleAction = () => {
    setIsProcessing(true);

    // Simulate process (install or uninstall)
    setTimeout(() => {
      setIsProcessing(false);
      // In a real app, we would update the app's installed status here
    }, 2000);
  };

  const handleDisable = () => {
    setIsProcessing(true);

    // Simulate disabling
    setTimeout(() => {
      setIsProcessing(false);
    }, 1500);
  };

  const handleUninstall = () => {
    setIsProcessing(true);

    // Simulate uninstalling
    setTimeout(() => {
      setIsProcessing(false);
      // Would redirect back to apps list after uninstall
      onBack();
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full">
      <Toolbar
        title="App Details"
        icon={<ChevronLeft className="h-4 w-4 cursor-pointer" onClick={onBack} />}
      >
        {!app.installed ? (
          <Button onClick={handleAction} disabled={isProcessing}>
            {isProcessing ? "Installing..." : "Install"}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-2">
              <Switch
                id="auto-update"
                checked={autoUpdateEnabled}
                onCheckedChange={setAutoUpdateEnabled}
              />
              <Label htmlFor="auto-update" className="text-sm cursor-pointer">
                Auto-update
              </Label>
            </div>
            <Button variant="outline" onClick={handleDisable} disabled={isProcessing}>
              {isProcessing ? "Disabling..." : "Disable"}
            </Button>
            <Button variant="destructive" onClick={handleUninstall} disabled={isProcessing}>
              Uninstall
            </Button>
          </div>
        )}
      </Toolbar>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="text-5xl md:text-6xl">{app.icon}</div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold">{app.name}</h2>
                  {app.verified && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mb-2">{app.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-1 text-yellow-500" />
                    {app.stars} stars
                  </div>
                  <div className="flex items-center">
                    <Download className="h-4 w-4 mr-1" />
                    {app.downloads.toLocaleString()} downloads
                  </div>
                  <div>
                    <span className="text-muted-foreground">by </span>
                    <span className="font-medium">{app.publisher || app.author}</span>
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
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-6">
                  <div className="col-span-2">
                    <h3 className="text-lg font-medium mb-2">Description</h3>
                    <div className="prose prose-sm prose-slate max-w-none dark:prose-invert">
                      {app.longDescription ? (
                        <ReactMarkdown
                          components={{
                            code({ node, inline, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || '')
                              return !inline && match ? (
                                <SyntaxHighlighter
                                  style={vscDarkPlus}
                                  language={match[1]}
                                  PreTag="div"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              )
                            }
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
                    <h3 className="text-lg font-medium mb-2">Details</h3>
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

                      {app.pricing && (
                        <>
                          <dt className="text-muted-foreground">Pricing</dt>
                          <dd>{app.pricing}</dd>
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
                              <a
                                href={app.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center"
                              >
                                Website <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            )}
                            {app.repository && (
                              <a
                                href={app.repository}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center"
                              >
                                Repository <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            )}
                          </dd>
                        </>
                      )}
                    </dl>
                  </div>
                </div>

                {app.screenshots && app.screenshots.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Screenshots</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {app.screenshots.map((screenshot, index) => (
                        <img
                          key={index}
                          src={screenshot || "/placeholder.svg"}
                          alt={`${app.name} screenshot ${index + 1}`}
                          className="rounded-md border object-cover w-full aspect-video"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="features">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Code className="h-5 w-5 text-blue-500" />
                      <h3 className="font-medium">Developer Tools</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Powerful tools for developers to analyze and transform data with custom scripts.
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-5 w-5 text-green-500" />
                      <h3 className="font-medium">Data Security</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      End-to-end encryption and secure data handling to protect your sensitive information.
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-5 w-5 text-purple-500" />
                      <h3 className="font-medium">Collaboration</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Real-time collaboration features for team analysis and decision making.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reviews">
                {app.reviews && app.reviews.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-bold">
                        {(app.reviews.reduce((acc, review) => acc + review.rating, 0) / app.reviews.length).toFixed(1)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-5 w-5 ${star <= app.reviews.reduce((acc, review) => acc + review.rating, 0) / app.reviews.length
                                ? "text-yellow-500"
                                : "text-gray-300"
                                }`}
                              fill={
                                star <= app.reviews.reduce((acc, review) => acc + review.rating, 0) / app.reviews.length
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                          ))}
                          <span className="ml-2 text-sm text-muted-foreground">
                            Based on {app.reviews.length} reviews
                          </span>
                        </div>
                      </div>
                      <Button variant="outline">Write a Review</Button>
                    </div>

                    <div className="space-y-4">
                      {app.reviews.map((review) => (
                        <div key={review.id} className="border rounded-lg p-4">
                          <div className="flex justify-between mb-2">
                            <div className="font-medium">{review.author}</div>
                            <div className="text-sm text-muted-foreground">{review.date}</div>
                          </div>
                          <div className="flex items-center mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${star <= review.rating ? "text-yellow-500" : "text-gray-300"}`}
                                fill={star <= review.rating ? "currentColor" : "none"}
                              />
                            ))}
                          </div>
                          <p className="text-sm">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40 text-muted-foreground">
                    No reviews available for this app
                  </div>
                )}
              </TabsContent>

              <TabsContent value="changelog">
                <div className="space-y-4">
                  <div className="border-l-2 border-blue-500 pl-4 ml-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">Version {app.version || "1.0.0"}</h3>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Latest</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">Released on {app.lastUpdated || "January 1, 2024"}</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Fixed bug in data export functionality</li>
                      <li>Improved performance for large datasets</li>
                      <li>Added new visualization options</li>
                    </ul>
                  </div>

                  <div className="border-l-2 border-gray-300 pl-4 ml-4">
                    <h3 className="font-medium">Version {app.version ? parseFloat(app.version) - 0.1 : "0.9.0"}</h3>
                    <p className="text-sm text-muted-foreground mb-1">Released on November 5, 2023</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Added support for CSV and Excel import/export</li>
                      <li>New dark mode theme</li>
                      <li>Performance improvements</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}