"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppWindow, Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppDetail } from "@/components/app/app-detail"
import { AppList } from "@/components/app/app-list"
import { mockApps } from "@/lib/mock-apps"
import { Toolbar } from "@/components/ui/toolbar"

export default function AppsPage() {
    const router = useRouter();
    const params = useSearchParams();
    const [selectedApp, setSelectedApp] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    // Filter to only show installed apps
    const installedApps = mockApps.filter(app => app.installed);

    const handleUninstallApp = (appId: string) => {
        // Logic to uninstall the app would go here
        console.log(`Uninstalling app with id: ${appId}`)
    }

    useEffect(() => {
        const id = params.get("id") || null;
        setSelectedApp(id);
    }, [params])

    if (selectedApp) {
        return <AppDetail appId={selectedApp} onBack={() => router.push("/apps")} />;
    }

    return (
        <div className="flex flex-col h-full">
            <Toolbar
                title="Apps"
                icon={<AppWindow className="h-5 w-5" />}
            >
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search installed apps..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline" onClick={() => window.location.href = "/marketplace"} className="gap-0">
                    <Plus className="h-4 w-4 mr-2" />
                    <span>Add App</span>
                </Button>
            </Toolbar>

            <Tabs defaultValue="all" className="flex-1">
                <div className="px-4 py-2 border-b overflow-x-auto">
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="recent">Recently Used</TabsTrigger>
                        <TabsTrigger value="favorite">Favorites</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="all" className="flex-1 p-0">
                    {installedApps.length > 0 ? (
                        <AppList
                            apps={installedApps}
                            onSelectApp={(appId) => router.push(`/apps?id=${appId}`)}
                            onActionClick={handleUninstallApp}
                            searchQuery={searchQuery}
                            viewContext="apps"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                            <div className="text-5xl mb-4">📦</div>
                            <h3 className="text-lg font-medium mb-2">No Apps Installed</h3>
                            <p className="text-muted-foreground mb-4">
                                You haven't installed any apps yet. Visit the marketplace to find and install apps.
                            </p>
                            <Button onClick={() => window.location.href = "/marketplace"}>
                                Browse Marketplace
                            </Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="recent" className="flex-1 p-0">
                    <div className="flex items-center justify-center h-40 text-muted-foreground">
                        Your recently used apps will appear here
                    </div>
                </TabsContent>

                <TabsContent value="favorite" className="flex-1 p-0">
                    <div className="flex items-center justify-center h-40 text-muted-foreground">
                        Your favorite apps will appear here
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}