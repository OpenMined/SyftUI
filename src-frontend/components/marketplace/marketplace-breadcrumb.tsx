"use client";

import type React from "react";
import { useQueryState } from "nuqs";
import { useRouter } from "next/navigation";
import { ChevronRight, ShoppingBag } from "lucide-react";
import { type MarketplaceApp } from "@/lib/api/marketplace";
import { Suspense } from "react";

interface MarketplaceBreadcrumbContentProps {
  app: MarketplaceApp | null;
}

function MarketplaceBreadcrumbContent({
  app,
}: MarketplaceBreadcrumbContentProps) {
  const router = useRouter();
  const [selectedApp] = useQueryState("id");

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

interface MarketplaceBreadcrumbProps {
  app?: MarketplaceApp | null;
}

export function MarketplaceBreadcrumb({ app }: MarketplaceBreadcrumbProps) {
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
      <MarketplaceBreadcrumbContent app={app} />
    </Suspense>
  );
}
