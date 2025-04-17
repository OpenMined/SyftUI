"use client";

import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoComponent } from "@/components/logo";
import { FloatingConnectionStatus } from "@/components/floating-connection-status";
import { OnboardingCard } from "@/components/onboarding";
import { useConnectionStore } from "@/stores";

export default function HomePage() {
  const router = useRouter();
  const { status, settings } = useConnectionStore();

  // Navigate to app with next parameter support
  const navigateToApp = () => {
    const params = new URLSearchParams(window.location.search);
    const nextUrl = params.get("next") || "/dashboard";
    router.push(nextUrl);

    toast({
      icon: "🎉",
      title: "Welcome to SyftBox!",
      description: "You're all set up and ready to go.",
      variant: "default",
    });
  };

  return (
    <>
      <div className="mb-8 flex items-center justify-between p-6">
        <div className="flex h-[40] w-[180] items-center">
          <LogoComponent />
        </div>
        <ThemeToggle />
      </div>

      <OnboardingCard onComplete={navigateToApp} />

      <FloatingConnectionStatus
        status={status}
        url={settings.url}
        position="bottom-right"
      />
    </>
  );
}
