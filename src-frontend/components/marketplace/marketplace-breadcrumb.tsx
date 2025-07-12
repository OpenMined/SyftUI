"use client";

import type React from "react";
import { useQueryState } from "nuqs";
import { useRouter } from "next/navigation";
import { ChevronRight, ShoppingBag } from "lucide-react";
import { type MarketplaceApp } from "@/lib/api/marketplace";
import { getMarketplaceApp } from "@/lib/api/marketplace";
import { useEffect, useState, Suspense } from "react";

function MarketplaceBreadcrumbContent() {
  const router = useRouter();
  const [selectedApp] = useQueryState("id");
  const [app, setApp] = useState<MarketplaceApp | null>(null);

  // Find app details when selectedApp changes
  useEffect(() => {
    const fetchApp = async () => {
      if (selectedApp) {
        try {
          const foundApp = await getMarketplaceApp(selectedApp);
          setApp(foundApp);
        } catch (error) {
          console.error("Failed to fetch app:", error);
          setApp(null);
        }
      } else {
        setApp(null);
      }
    };

    fetchApp();
  }, [selectedApp]);

  const handleNavigateToMarketplace = () => {
    router.push("/marketplace");
  };

  const handleNavigateToApp = () => {
    if (selectedApp) {
      router.push(`/marketplace?id=${selectedApp}`);
    }
  };

  return (
    <div className="inline-flex items-center">
      <button
        onClick={handleNavigateToMarketplace}
        className="hover:bg-accent-foreground/15 hover:text-accent-foreground flex items-center gap-2 rounded-md p-1 text-sm"
      >
        <ShoppingBag className="h-4 w-4" />
        <span>Marketplace</span>
      </button>

      {selectedApp && app && (
        <>
          <ChevronRight className="text-muted-foreground mx-1 h-4 w-4" />
          <button
            onClick={handleNavigateToApp}
            className="hover:bg-accent-foreground/15 hover:text-accent-foreground rounded-md p-1 text-sm"
          >
            {app.name}
          </button>
        </>
      )}
    </div>
  );
}

export function MarketplaceBreadcrumb() {
  return (
    <Suspense
      fallback={
        <div className="inline-flex items-center">
          <div className="hover:bg-accent-foreground/15 hover:text-accent-foreground flex items-center gap-2 rounded-md p-1 text-sm">
            <ShoppingBag className="h-4 w-4" />
            <span>Marketplace</span>
          </div>
        </div>
      }
    >
      <MarketplaceBreadcrumbContent />
    </Suspense>
  );
}
