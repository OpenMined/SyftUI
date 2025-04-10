"use client";

import { Button } from "@/components/ui/button";
import { Github, Mail, Twitter } from "lucide-react";

interface SocialConnectionButtonProps {
  provider: "github" | "google" | "twitter";
  isConnected?: boolean;
  username?: string;
  email?: string;
}

export function SocialConnectionButton({
  provider,
  isConnected = false,
  username,
  email,
}: SocialConnectionButtonProps) {
  const getProviderDetails = () => {
    switch (provider) {
      case "github":
        return {
          name: "GitHub",
          icon: <Github className="mr-2 h-4 w-4" />,
          connectText: "Connect with GitHub",
          disconnectText: "Disconnect GitHub",
        };
      case "google":
        return {
          name: "Google",
          icon: <Mail className="mr-2 h-4 w-4" />,
          connectText: "Connect with Google",
          disconnectText: "Disconnect Google",
        };
      case "twitter":
        return {
          name: "X (Twitter)",
          icon: <Twitter className="mr-2 h-4 w-4" />,
          connectText: "Connect with X",
          disconnectText: "Disconnect X",
        };
    }
  };

  const details = getProviderDetails();

  const handleConnect = () => {
    // In a real app, this would trigger the OAuth flow
    console.log(`Connecting to ${provider}...`);
  };

  const handleDisconnect = () => {
    // In a real app, this would disconnect the account
    console.log(`Disconnecting from ${provider}...`);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
          {details.icon}
        </div>
        <div>
          <p className="text-sm font-medium">{details.name}</p>
          {isConnected && (
            <p className="text-muted-foreground text-xs">
              {username ? `@${username}` : email}
            </p>
          )}
        </div>
      </div>
      <Button
        variant={isConnected ? "outline" : "default"}
        size="sm"
        onClick={isConnected ? handleDisconnect : handleConnect}
      >
        {isConnected ? "Disconnect" : "Connect"}
      </Button>
    </div>
  );
}
