"use client"

import { useState } from "react"
import { Search, Plus, Filter, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppDetail } from "@/components/app/app-detail"
import { AppList } from "@/components/app/app-list"
import { mockApps } from "@/lib/mock-apps"
import { Toolbar } from "@/components/ui/toolbar"

export default function MarketplacePage() {
    const [selectedApp, setSelectedApp] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false)
    const [repoUrl, setRepoUrl] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

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

    const handleAppInstall = (appId: string) => {
        // Here would be the logic to install the app
        console.log(`Installing app with id: ${appId}`)
    }

    if (selectedApp) {
        return <AppDetail appId={selectedApp} onBack={() => setSelectedApp(null)} />;
    }

    return (
        <div className="flex flex-col h-full">
            <Toolbar
                leftSection={
                <div className="flex items-center gap-2">
                    <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search apps..."
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
                }
            >
                <Button onClick={() => setIsPublishDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Publish App</span>
                </Button>
            </Toolbar>

            <Tabs defaultValue="all" className="flex-1">
                <div className="px-4 py-2 border-b overflow-x-auto">
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="recommended">Recommended</TabsTrigger>
                    <TabsTrigger value="popular">Popular</TabsTrigger>
                    <TabsTrigger value="recent">Recent</TabsTrigger>
                </TabsList>
                </div>

                <TabsContent value="all" className="flex-1 p-0">
                    <AppList 
                        apps={mockApps} 
                        onSelectApp={(appId) => setSelectedApp(appId)} 
                        onActionClick={handleAppInstall}
                        searchQuery={searchQuery}
                        viewContext="marketplace"
                    />
                </TabsContent>

                <TabsContent value="recommended" className="flex-1 p-0">
                <div className="flex items-center justify-center h-40 text-muted-foreground">
                    Recommendations will appear here based on your usage
                </div>
                </TabsContent>

                <TabsContent value="popular" className="flex-1 p-0">
                <div className="flex items-center justify-center h-40 text-muted-foreground">
                    Loading popular apps...
                </div>
                </TabsContent>

                <TabsContent value="recent" className="flex-1 p-0">
                <div className="flex items-center justify-center h-40 text-muted-foreground">
                    Loading recently added and updated apps...
                </div>
                </TabsContent>
            </Tabs>

            <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
                <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Publish App</DialogTitle>
                </DialogHeader>

                {!isSubmitted ? (
                    <>
                    <div className="py-4">
                        <p className="text-sm mb-4">
                        Submit your GitHub repository URL to publish your app to the marketplace. Our team will review
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
                            Make sure your repository includes a valid manifest.json file with app metadata.
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
                        Thank you for your submission. Our team will review your app and get back to you soon.
                    </p>
                    </div>
                )}
                </DialogContent>
            </Dialog>
        </div>
    )
}