"use client"

import { useState } from "react"
import { Folder, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

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
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [settings, setSettings] = useState<SettingsData>({
        data_dir: "/Users/username/SyftBoxStage",
        server_url: "https://syftbox.openmined.org/",
        client_url: "http://127.0.0.1:8080/",
        email: "user@example.com",
        token: "0",
        access_token:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRhdXF1aXJAb3Blbm1pbmVkLm9yZyIsInR5cGUiOiJhY2Nlc3NfdG9rZW4iLCJpYXQiOjE3MzY5NDQxNjd9.YqRMwd9StsRUA_sAQuz1zSwkHtAV_RWdhCktCHW1E5s",
        client_timeout: 5.0,
    })

    const handleDirectorySelect = async () => {
        try {
            const dirHandle = await window.showDirectoryPicker({
                id: "syftBoxDataDir",
                startIn: "documents",
                mode: "readwrite",
            })
            setSettings({
                ...settings,
                data_dir: dirHandle.name,
            })
            toast({
                title: "Directory selected",
                description: `Selected: ${dirHandle.name}`,
            })
        } catch (error) {
            console.error("Directory selection failed:", error)
        }
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
                title: "Settings saved",
                description: "Your SyftBox settings have been updated successfully.",
            })
        }, 1000)
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">SyftBox Settings</h1>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Data Storage</CardTitle>
                    <CardDescription>Configure where SyftBox stores your data</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="data-dir">Data Directory</Label>
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
                </CardContent>
            </Card>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Connection Settings</CardTitle>
                    <CardDescription>Configure server and client connection details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="server-url">Server URL</Label>
                        <Input
                            id="server-url"
                            value={settings.server_url}
                            onChange={(e) => handleInputChange("server_url", e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="client-url">Client URL</Label>
                        <Input
                            id="client-url"
                            value={settings.client_url}
                            onChange={(e) => handleInputChange("client_url", e.target.value)}
                        />
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
                    <CardTitle>Authentication</CardTitle>
                    <CardDescription>Manage your authentication details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={settings.email} onChange={(e) => handleInputChange("email", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="token">Token</Label>
                        <Input id="token" value={settings.token} onChange={(e) => handleInputChange("token", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="access-token">Access Token</Label>
                        <Input
                            id="access-token"
                            value={settings.access_token}
                            onChange={(e) => handleInputChange("access_token", e.target.value)}
                        />
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
