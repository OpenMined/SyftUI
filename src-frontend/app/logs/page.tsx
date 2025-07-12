"use client";

import { useEffect } from "react";
import { Logs } from "@/components/logs";
import { useBreadcrumbStore } from "@/stores";
import { ScrollText } from "lucide-react";

export default function LogsPage() {
  const { setBreadcrumb, clearBreadcrumb } = useBreadcrumbStore();

  useEffect(() => {
    setBreadcrumb(
      <span className="flex items-center gap-2 p-1 text-sm">
        <ScrollText className="h-4 w-4" />
        <span>Logs</span>
      </span>,
    );
    return () => clearBreadcrumb();
  }, [setBreadcrumb, clearBreadcrumb]);

  return <Logs />;
}
