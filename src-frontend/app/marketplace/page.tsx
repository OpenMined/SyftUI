"use client";

import { useQueryState } from "nuqs";
import { useRouter } from "next/navigation";
import { AppDetail } from "@/components/marketplace/app-detail";
import { AppList } from "@/components/marketplace/app-list";
import { Suspense } from "react";

function MarketplacePageContent() {
  const router = useRouter();
  const [selectedApp] = useQueryState("id");

  return selectedApp ? (
    <AppDetail appId={selectedApp} onBack={() => router.push("/marketplace")} />
  ) : (
    <AppList onSelectApp={(appId) => router.push(`/marketplace?id=${appId}`)} />
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MarketplacePageContent />
    </Suspense>
  );
}
