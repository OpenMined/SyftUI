"use client"

import { useState } from "react"
import { Folder, Save, Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"

interface SettingsData {
    data_dir: string
    server_url: string
    client_url: string
    email: string
    token: string
    access_token: string
    client_timeout: number
}

export function Settings() {
    const [isLoading, setIsLoading] = useState(false)
    const [showToken, setShowToken] = useState(false)
    const [showAccessToken, setShowAccessToken] = useState(false)
    const [settings, setSettings] = useState<SettingsData>({
        data_dir: "~/SyftBoxStage",
        server_url: "https://syftbox.openmined.org/",
        client_url: "http://127.0.0.1:8080/",
        email: "user@example.com",
        token: "eyJlbWFpbCI6InRhdXF1aXJAb3Blbm1pbmVkLm9yZyIsInR5cGUiOiJhY2Nlc3N",
        access_token:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YqRMwd9StsRUA_sAQuz1zSwkHtAV",
        client_timeout: 5.0,
    })

    const handleDirectorySelect = () => {
        toast({
            icon: "🐱",
            title: "Feature Coming Soon!",
            description: "Hang tight! We're working on this feature. Meanwhile, here's a cat for ya!",
            variant: "default",
        })
    }

    const handleInputChange = (key: keyof SettingsData, value: string | number) => {
        setSettings({
            ...settings,
            [key]: value,
        })
    }

    const handleSaveSettings = () => {
        setIsLoading(true)

        // Simulate saving settings
        setTimeout(() => {
            setIsLoading(false)
            toast({
                icon: "✅",
                title: "Settings saved",
                description: "Your SyftBox settings have been updated successfully.",
                variant: "default",
            })
        }, 1000)
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">SyftBox Settings</h1>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>SyftUI settings</CardTitle>
                    <CardDescription>
                        Details for SyftUI to communicate with SyftBox CLI
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="client-url">Client URL</Label>
                        <Input
                            id="client-url"
                            value={settings.client_url}
                            onChange={(e) => handleInputChange("client_url", e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="token">Client Token</Label>
                        <div className="relative">
                            <Input
                                id="token"
                                type={showToken ? "text" : "password"}
                                value={settings.token}
                                onChange={(e) => handleInputChange("token", e.target.value)}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 cursor-pointer"
                                onClick={() => setShowToken(!showToken)}
                                aria-label={showToken ? "Hide token" : "Show token"}
                            >
                                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="client-timeout">Client Timeout (seconds)</Label>
                        <Input
                            id="client-timeout"
                            type="number"
                            step="0.1"
                            value={settings.client_timeout}
                            onChange={(e) => handleInputChange("client_timeout", Number.parseFloat(e.target.value))}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Server settings</CardTitle>
                    <CardDescription>Details for SyftBox CLI to communicate with the relay server</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="data-dir">Workspace Directory</Label>
                        <div className="flex space-x-2">
                            <Input
                                id="data-dir"
                                value={settings.data_dir}
                                onChange={(e) => handleInputChange("data_dir", e.target.value)}
                            />
                            <Button variant="outline" onClick={handleDirectorySelect} type="button">
                                <Folder className="h-4 w-4 mr-2" />
                                Browse
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="server-url">Server URL</Label>
                        <Input
                            id="server-url"
                            value={settings.server_url}
                            onChange={(e) => handleInputChange("server_url", e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Authentication settings</CardTitle>
                    <CardDescription>Details for managing server authentication</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={settings.email} onChange={(e) => handleInputChange("email", e.target.value)} autoComplete="off" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="access-token">Access Token</Label>
                        <div className="relative">
                            <Input
                                id="access-token"
                                type={showAccessToken ? "text" : "password"}
                                value={settings.access_token}
                                onChange={(e) => handleInputChange("access_token", e.target.value)}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 cursor-pointer"
                                onClick={() => setShowAccessToken(!showAccessToken)}
                                aria-label={showAccessToken ? "Hide access token" : "Show access token"}
                            >
                                {showAccessToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">This token is used to authenticate with the SyftBox server.</p>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? "Saving..." : "Save Settings"}
                </Button>
            </div>
        </div>
    )
}
