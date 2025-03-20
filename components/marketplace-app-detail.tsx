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

interface MarketplaceAppDetailProps {
  appId: string
  onBack: () => void
}

export function MarketplaceAppDetail({ appId, onBack }: MarketplaceAppDetailProps) {
  const [isInstalling, setIsInstalling] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  // Mock data for the selected app
  const app = {
    id: appId,
    name: "Inbox",
    description: "Send, receive and broadcast API requests between datasites",
    longDescription: `# Inbox API

The Inbox API is a component of the SyftBox ecosystem designed to send and receive API requests between datasites. This app is compatible with MacOS and Linux.

## Features

* Receive and process API requests from others.
* Send API requests to any datasite.
* Broadcast API requests to all datasites.
* Send email and desktop notifications for new API requests.

## Usage

### What is an API?

An API is any folder containing a \`run.sh\` entry script.

### Sending API Requests

You can share your API with datasites in two ways:

1. **Send to a Single Datasite**  
   Copy your API folder into the target datasite's \`inbox/\` directory.

2. **Broadcast to All Datasites**  
   Place your API folder in the \`/SyftBox/apis/broadcast/\` directory.
   The system will:
   * Validate your API.
   * Send it to all datasites with the Inbox API installed.

After an API is sent, datasite owners will receive notifications (desktop and email). They can then review the code of your API request and choose to **approve** or **reject** it. Approved requests execute automatically if the recipient's SyftBox client is active.

### Managing Incoming API Requests

Incoming API requests appear in your datasite's \`inbox/\` folder. Here's how to handle them:

1. **Folder Structure**
   The \`inbox/\` folder contains two symlinked subfolders:
   * \`approved\`: Links to \`/SyftBox/apis/\`, where approved APIs start executing automatically.
   * \`rejected\`: Serves as a temporary bin. Rejected APIs remain here for 7 days before being deleted.

2. **Review Process**
   * Inspect the code of new API requests in the \`inbox/\` folder.
   * After reviewing, move the API folder to either \`approved\` or \`rejected\`.

### Uninstalling the Inbox API

The Inbox API is an API in itself and can be uninstalled if needed. To uninstall, simply delete the \`/SyftBox/apis/inbox/\` directory along with its contents.
`,
    author: "OpenMined",
    publisher: "OpenMined Organization",
    version: "0.1.2",
    lastUpdated: "2023-12-20",
    stars: 87,
    downloads: 3450,
    tags: ["api", "datasite", "syftbox", "communication"],
    verified: true,
    icon: "📬",
    screenshots: [
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
    ],
    pricing: "Free",
    website: "https://github.com/OpenMined/inbox",
    repository: "https://github.com/OpenMined/inbox",
    license: "Apache-2.0",
    reviews: [
      {
        id: "1",
        author: "Data Scientist X",
        rating: 5,
        date: "2023-11-20",
        comment: "Essential tool for our multi-organization data collaboration project. Makes API sharing seamless.",
      },
      {
        id: "2",
        author: "Privacy Engineer Y",
        rating: 4,
        date: "2023-10-15",
        comment: "Very useful for our privacy-preserving data analysis workflow. Easy to integrate.",
      },
      {
        id: "3",
        author: "Research Group Z",
        rating: 5,
        date: "2023-09-30",
        comment: "This has completely transformed how we share analytics requests across our partner network. Highly recommended!",
      },
    ],
  }

  const handleInstall = () => {
    setIsInstalling(true)

    // Simulate installation process
    setTimeout(() => {
      setIsInstalling(false)
      setIsInstalled(true)
    }, 2000)
  }

  return (
    <div className="flex flex-col h-full">
      <Toolbar
        title="App Details"
        icon={<ChevronLeft className="h-4 w-4 cursor-pointer" onClick={onBack} />}
      >
        {!isInstalled ? (
          <Button onClick={handleInstall} disabled={isInstalling}>
            {isInstalling ? "Installing..." : "Install"}
          </Button>
        ) : (
          <Button variant="outline" disabled>
            Installed
          </Button>
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
                    <span className="font-medium">{app.publisher}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {!isInstalled ? (
                  <Button className="w-full md:w-auto" onClick={handleInstall} disabled={isInstalling}>
                    {isInstalling ? "Installing..." : "Install"}
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full md:w-auto" disabled>
                    Installed
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
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
                    </div>
                  </div>

                  <div className="lg:w-80 lg:border-l lg:pl-6">
                    <h3 className="text-lg font-medium mb-2">Details</h3>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <dt className="text-muted-foreground">Version</dt>
                      <dd>{app.version}</dd>

                      <dt className="text-muted-foreground">Last Updated</dt>
                      <dd>{app.lastUpdated}</dd>

                      <dt className="text-muted-foreground">License</dt>
                      <dd>{app.license}</dd>

                      <dt className="text-muted-foreground">Pricing</dt>
                      <dd>{app.pricing}</dd>

                      <dt className="text-muted-foreground">Categories</dt>
                      <dd className="flex flex-wrap gap-1">
                        {app.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </dd>

                      <dt className="text-muted-foreground">Links</dt>
                      <dd className="flex flex-wrap gap-2">
                        <a
                          href={app.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center"
                        >
                          Website <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                        <a
                          href={app.repository}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center"
                        >
                          Repository <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </dd>
                    </dl>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Screenshots</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {app.screenshots.map((screenshot, index) => (
                      <img
                        key={index}
                        src={screenshot || "/placeholder.svg"}
                        alt={`${app.name} screenshot ${index + 1} `}
                        className="rounded-md border object-cover w-full aspect-video"
                      />
                    ))}
                  </div>
                </div>
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
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold">4.7</div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h - 5 w - 5 ${star <= 4.7 ? "text-yellow-500" : "text-gray-300"} `}
                            fill={star <= 4.7 ? "currentColor" : "none"}
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
                              className={`h - 4 w - 4 ${star <= review.rating ? "text-yellow-500" : "text-gray-300"} `}
                              fill={star <= review.rating ? "currentColor" : "none"}
                            />
                          ))}
                        </div>
                        <p className="text-sm">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="changelog">
                <div className="space-y-4">
                  <div className="border-l-2 border-blue-500 pl-4 ml-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">Version 2.3.4</h3>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Latest</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">Released on December 15, 2023</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Fixed bug in data export functionality</li>
                      <li>Improved performance for large datasets</li>
                      <li>Added new visualization options</li>
                    </ul>
                  </div>

                  <div className="border-l-2 border-gray-300 pl-4 ml-4">
                    <h3 className="font-medium">Version 2.3.0</h3>
                    <p className="text-sm text-muted-foreground mb-1">Released on November 5, 2023</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Added support for CSV and Excel import/export</li>
                      <li>New dark mode theme</li>
                      <li>Performance improvements</li>
                    </ul>
                  </div>

                  <div className="border-l-2 border-gray-300 pl-4 ml-4">
                    <h3 className="font-medium">Version 2.2.0</h3>
                    <p className="text-sm text-muted-foreground mb-1">Released on September 20, 2023</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Added real-time collaboration features</li>
                      <li>New chart types: bubble, radar, and funnel</li>
                      <li>Bug fixes and UI improvements</li>
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

