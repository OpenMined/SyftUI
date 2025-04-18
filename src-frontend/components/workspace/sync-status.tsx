import { Check, RefreshCw, Clock, AlertTriangle, XCircle } from "lucide-react";
import type { SyncStatus as SyncStatusType } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SyncStatusProps {
  status: SyncStatusType | "ignored";
  className?: string;
  variant?: "icon" | "badge";
}

export function SyncStatus({
  status,
  className,
  variant = "icon",
}: SyncStatusProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "synced":
        return <Check className="h-3 w-3" />;
      case "syncing":
        return <RefreshCw className="h-3 w-3 animate-spin" />;
      case "pending":
        return <Clock className="h-3 w-3" />;
      case "rejected":
        return <XCircle className="h-3 w-3" />;
      case "error":
        return <AlertTriangle className="h-3 w-3" />;
      case "ignored":
        return <XCircle className="h-3 w-3" />;
      case "hidden":
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "synced":
        return "bg-green-500 text-white";
      case "syncing":
        return "bg-blue-500 text-white";
      case "pending":
        return "bg-yellow-500 text-white";
      case "rejected":
        return "bg-red-500 text-white";
      case "error":
        return "bg-red-500 text-white";
      case "ignored":
        return "bg-gray-500 text-white";
      case "hidden":
        return "hidden";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "synced":
        return "Synced";
      case "syncing":
        return "Syncing...";
      case "pending":
        return "Sync pending";
      case "rejected":
        return "Sync rejected";
      case "error":
        return "Sync error";
      case "ignored":
        return "Sync ignored";
      case "hidden":
        return "";
    }
  };

  // Icon variant
  if (variant === "icon") {
    // Don't render anything for hidden status
    if (status === "hidden") {
      return null;
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "flex items-center justify-center rounded-full p-1",
                getStatusColor(),
                className,
              )}
            >
              {getStatusIcon()}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getStatusText()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Badge/capsule variant
  // Don't render anything for hidden status
  if (status === "hidden") {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center rounded-full border bg-white px-2 py-1 text-xs",
        {
          "border-green-200 bg-green-100 text-green-600": status === "synced",
          "border-blue-200 bg-blue-100 text-blue-600": status === "syncing",
          "border-yellow-200 bg-yellow-100 text-yellow-600":
            status === "pending",
          "border-red-200 bg-red-100 text-red-600":
            status === "rejected" || status === "error",
          "border-gray-200 bg-gray-100 text-gray-600": status === "ignored",
        },
        className,
      )}
    >
      <span className="mr-1">{getStatusIcon()}</span>
      <span>{getStatusText()}</span>
    </div>
  );
}
