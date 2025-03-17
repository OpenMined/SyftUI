"use client"

import { useState } from "react"
import { Search, Plus, Download, Star, ArrowUpDown, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

interface App {
  id: string
  name: string
  description: string
  author: string
  stars: number
  downloads: number
  tags: string[]
  verified: boolean
  icon: string
}

interface MarketplaceProps {
  onSelectApp?: (appId: string) => void
}

export function Marketplace({ onSelectApp }: MarketplaceProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false)
  const [repoUrl, setRepoUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Mock data for marketplace apps
  const apps: App[] = [
    {
      id: "1",
      name: "Inbox",
      description: "Send, receive and broadcast API requests between datasites",
      author: "OpenMined",
      stars: 3,
      downloads: 8964,
      tags: ["api", "datasite", "syftbox", "communication"],
      verified: true,
      icon: "📬",
    },
    {
      id: "2",
      name: "Sync Status Indicators",
      description: "Add sync status indicators to all datasite files in MacOS native file manager",
      author: "OpenMined",
      stars: 0,
      downloads: 7577,
      tags: ["sync", "UI", "UX"],
      verified: true,
      icon: "📡",
    },
    {
      id: "3",
      name: "FL Aggregator",
      description: "Perform Federated Learning over SyftBox",
      author: "OpenMined",
      stars: 1,
      downloads: 9910,
      tags: ["federated-learning", "aggregator", "server", "pets"],
      verified: true,
      icon: "🌐",
    },
    {
      id: "4",
      name: "FL Client",
      description: "Client for FL Aggregator",
      author: "OpenMined",
      stars: 0,
      downloads: 3603,
      tags: ["federated-learning", "client", "pets"],
      verified: true,
      icon: "👥",
    },
    {
      id: "5",
      name: "Github App Updater",
      description: "SyftBox app for auto-updating apps with a Github repository",
      author: "OpenMined",
      stars: 0,
      downloads: 4660,
      tags: ["github", "app", "updater"],
      verified: true,
      icon: "🐙",
    },
    {
      id: "6",
      name: "Ftop",
      description: "Federated Table of Processes",
      author: "OpenMined",
      stars: 1,
      downloads: 8627,
      tags: ["ftop", "syftbox", "data"],
      verified: true,
      icon: "📈",
    },
    {
      id: "7",
      name: "Logged In",
      description: "Publish your last login time to the SyftBox network",
      author: "OpenMined",
      stars: 0,
      downloads: 1618,
      tags: ["data", "syftbox"],
      verified: true,
      icon: "🔐",
    },
    {
      id: "8",
      name: "Pretrained Model Aggregator",
      description: "Create an aggregation pipeline for pretrained MNIST models using SyftBox",
      author: "OpenMined",
      stars: 1,
      downloads: 2464,
      tags: ["MNIST", "pretrained", "model", "aggregator", "server"],
      verified: true,
      icon: "📊",
    },
    {
      id: "9",
      name: "Ring",
      description: "Perform Homomorphic Encryption on SyftBox network",
      author: "OpenMined",
      stars: 1,
      downloads: 4517,
      tags: ["ring", "syftbox", "he", "homomorphic-encryption", "encryption"],
      verified: true,
      icon: "💍",
    },
  ]

  // Filter apps based on search query
  const filteredApps = apps.filter(
    (app) =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const handlePublishSubmit = () => {
    if (!repoUrl.trim()) return

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)

      // Reset after showing success message
      setTimeout(() => {
        setIsSubmitted(false)
        setRepoUrl("")
        setIsPublishDialogOpen(false)
      }, 3000)
    }, 1500)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between p-4 border-b gap-2">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search extensions..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="hidden sm:flex">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="hidden sm:flex">
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={() => setIsPublishDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Publish Extension</span>
        </Button>
      </div>

      <Tabs defaultValue="all" className="flex-1">
        <div className="px-4 pt-2 border-b overflow-x-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="installed">Installed</TabsTrigger>
            <TabsTrigger value="recommended">Recommended</TabsTrigger>
            <TabsTrigger value="popular">Popular</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {filteredApps.length > 0 ? (
                filteredApps.map((app) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border rounded-lg overflow-hidden flex flex-col cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all"
                    onClick={() => onSelectApp?.(app.id)}
                  >
                    <div className="p-4 flex items-start gap-3">
                      <div className="text-3xl">{app.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{app.name}</h3>
                          {app.verified && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">by {app.author}</p>
                      </div>
                    </div>

                    <div className="px-4 pb-2 flex-1">
                      <p className="text-sm line-clamp-2">{app.description}</p>
                    </div>

                    <div className="px-4 py-2 flex items-center text-sm text-muted-foreground">
                      <div className="flex items-center mr-4">
                        <Star className="h-4 w-4 mr-1 text-yellow-500" />
                        {app.stars}
                      </div>
                      <div className="flex items-center">
                        <Download className="h-4 w-4 mr-1" />
                        {app.downloads.toLocaleString()}
                      </div>
                      <div className="ml-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Install logic would go here
                          }}
                        >
                          Install
                        </Button>
                      </div>
                    </div>

                    <div className="px-4 py-2 border-t flex flex-wrap gap-1">
                      {app.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full flex items-center justify-center h-40 text-muted-foreground">
                  No extensions found matching your search
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="installed" className="flex-1 p-0">
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            You haven't installed any extensions yet
          </div>
        </TabsContent>

        <TabsContent value="recommended" className="flex-1 p-0">
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            Recommendations will appear here based on your usage
          </div>
        </TabsContent>

        <TabsContent value="popular" className="flex-1 p-0">
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            Loading popular extensions...
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Publish Extension</DialogTitle>
          </DialogHeader>

          {!isSubmitted ? (
            <>
              <div className="py-4">
                <p className="text-sm mb-4">
                  Submit your GitHub repository URL to publish your extension to the marketplace. Our team will review
                  your submission and approve it if it meets our guidelines.
                </p>
                <div className="space-y-2">
                  <label htmlFor="repo-url" className="text-sm font-medium">
                    GitHub Repository URL
                  </label>
                  <Input
                    id="repo-url"
                    placeholder="https://github.com/username/repo"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Make sure your repository includes a valid manifest.json file with extension metadata.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPublishDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handlePublishSubmit} disabled={isSubmitting || !repoUrl.trim()}>
                  {isSubmitting ? "Submitting..." : "Submit for Review"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="py-8 text-center">
              <div className="text-3xl mb-4">🎉</div>
              <h3 className="text-lg font-medium mb-2">Submission Received!</h3>
              <p className="text-sm text-muted-foreground">
                Thank you for your submission. Our team will review your extension and get back to you within 2-3
                business days.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

