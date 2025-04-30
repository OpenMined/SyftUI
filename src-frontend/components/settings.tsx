"use client";

import { useState } from "react";
import { Folder, Save, Eye, EyeOff, BarChart2 } from "lucide-react";
import { AnalyticsToggle } from "@/components/analytics-toggle";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface SettingsData {
  data_dir: string;
  server_url: string;
  client_url: string;
  email: string;
  token: string;
  access_token: string;
  client_timeout: number;
}

export function Settings() {
  const [isLoading, setIsLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    data_dir: "~/SyftBoxStage",
    server_url: "https://syftbox.openmined.org/",
    client_url: "http://127.0.0.1:7938/",
    email: "user@example.com",
    token: "eyJlbWFpbCI6InRhdXF1aXJAb3Blbm1pbmVkLm9yZyIsInR5cGUiOiJhY2Nlc3N",
    access_token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YqRMwd9StsRUA_sAQuz1zSwkHtAV",
    client_timeout: 5.0,
  });

  const handleDirectorySelect = () => {
    toast({
      icon: "🐱",
      title: "Feature Coming Soon!",
      description:
        "Hang tight! We're working on this feature. Meanwhile, here's a cat for ya!",
      variant: "default",
    });
  };

  const handleInputChange = (
    key: keyof SettingsData,
    value: string | number,
  ) => {
    setSettings({
      ...settings,
      [key]: value,
    });
  };

  const handleSaveSettings = () => {
    setIsLoading(true);

    // Simulate saving settings
    setTimeout(() => {
      setIsLoading(false);
      toast({
        icon: "✅",
        title: "Settings saved",
        description: "Your SyftBox settings have been updated successfully.",
        variant: "default",
      });
    }, 1000);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold">SyftBox Settings</h1>

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
                className="absolute top-0 right-0 h-full cursor-pointer px-3"
                onClick={() => setShowToken(!showToken)}
                aria-label={showToken ? "Hide token" : "Show token"}
              >
                {showToken ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
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
              onChange={(e) =>
                handleInputChange(
                  "client_timeout",
                  Number.parseFloat(e.target.value),
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Server settings</CardTitle>
          <CardDescription>
            Details for SyftBox CLI to communicate with the relay server
          </CardDescription>
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
              <Button
                variant="outline"
                onClick={handleDirectorySelect}
                type="button"
              >
                <Folder className="mr-2 h-4 w-4" />
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
          <CardDescription>
            Details for managing server authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={settings.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="access-token">Access Token</Label>
            <div className="relative">
              <Input
                id="access-token"
                type={showAccessToken ? "text" : "password"}
                value={settings.access_token}
                onChange={(e) =>
                  handleInputChange("access_token", e.target.value)
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-0 right-0 h-full cursor-pointer px-3"
                onClick={() => setShowAccessToken(!showAccessToken)}
                aria-label={
                  showAccessToken ? "Hide access token" : "Show access token"
                }
              >
                {showAccessToken ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              This token is used to authenticate with the SyftBox server.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Privacy settings</CardTitle>
          <CardDescription>
            Control how your usage data is collected
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center">
              <BarChart2 className="text-muted-foreground mr-2 h-5 w-5" />
              <h3 className="text-lg font-medium">Analytics</h3>
              <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                Beta Required
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              Analytics helps us understand how SyftBox is used, allowing us to
              improve the experience. During this beta phase, analytics
              collection is mandatory to help us identify and fix issues
              quickly. No personal data or contents of your files are ever
              collected.
            </p>
            <AnalyticsToggle className="mt-2" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={isLoading}>
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
