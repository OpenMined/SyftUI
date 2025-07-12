"use client";

import { useQueryState } from "nuqs";
import { useRouter } from "next/navigation";
import { AppList } from "@/components/apps/app-list";
import { AppDetail } from "@/components/apps/app-detail";
import { Suspense } from "react";

function AppsPageContent() {
  const router = useRouter();
  const [selectedApp] = useQueryState("id");

  return selectedApp ? (
    <AppDetail appId={selectedApp} onBack={() => router.push("/apps")} />
  ) : (
    <AppList onSelectApp={(appId) => router.push(`/apps?id=${appId}`)} />
  );
}

export default function AppsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AppsPageContent />
    </Suspense>
  );
}
