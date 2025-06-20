"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { LogoComponent } from "@/components/logo/logo";
import { FloatingConnectionStatus } from "@/components/floating-connection-status";
import { OnboardingCard } from "@/components/onboarding";
import { initializationService } from "@/lib/initialization";
import { useConnectionStore } from "@/stores";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  const router = useRouter();
  const { status, settings } = useConnectionStore();

  const navigateToApp = useCallback(
    (didOnboard: boolean = false) => {
      const params = new URLSearchParams(window.location.search);
      const nextUrl = params.get("next") || "/workspace";
      router.push(nextUrl);

      // Run initialization once when the app starts
      if (typeof window !== "undefined") {
        initializationService.initialize().catch(console.error);
      }

      if (didOnboard) {
        toast({
          icon: "🎉",
          title: "Welcome to SyftBox!",
          description: "You're all set up and ready to go.",
          variant: "default",
        });
      }
    },
    [router],
  );

  return (
    <>
      <div className="mb-8 flex items-center justify-center p-6">
        <div className="flex h-[40] w-[180] items-center">
          <LogoComponent />
        </div>
        <div className="absolute top-1.5 right-3 z-[1000]">
          <ThemeToggle />
        </div>
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
