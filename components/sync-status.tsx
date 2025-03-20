import { Check, RefreshCw, Clock, AlertTriangle, XCircle } from "lucide-react"
import type { SyncStatus as SyncStatusType } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SyncStatusProps {
  status: SyncStatusType | "ignored"
  className?: string
  variant?: "icon" | "badge"
}

export function SyncStatus({ status, className, variant = "icon" }: SyncStatusProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "synced":
        return <Check className="h-3 w-3" />
      case "syncing":
        return <RefreshCw className="h-3 w-3 animate-spin" />
      case "pending":
        return <Clock className="h-3 w-3" />
      case "rejected":
        return <XCircle className="h-3 w-3" />
      case "error":
        return <AlertTriangle className="h-3 w-3" />
      case "ignored":
        return <XCircle className="h-3 w-3" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case "synced":
        return "bg-green-500 text-white"
      case "syncing":
        return "bg-blue-500 text-white"
      case "pending":
        return "bg-yellow-500 text-white"
      case "rejected":
        return "bg-red-500 text-white"
      case "error":
        return "bg-red-500 text-white"
      case "ignored":
        return "bg-gray-500 text-white"
    }
  }

  const getStatusText = () => {
    switch (status) {
      case "synced":
        return "Synced"
      case "syncing":
        return "Syncing..."
      case "pending":
        return "Sync pending"
      case "rejected":
        return "Sync rejected"
      case "error":
        return "Sync error"
      case "ignored":
        return "Sync ignored"
    }
  }

  // Icon variant
  if (variant === "icon") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center justify-center rounded-full p-1", getStatusColor(), className)}>
              {getStatusIcon()}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getStatusText()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Badge/capsule variant
  return (
    <div
      className={cn(
        "flex items-center bg-white border px-2 py-1 rounded-full text-xs",
        {
          "bg-green-100 text-green-600 border-green-200": status === "synced",
          "bg-blue-100 text-blue-600 border-blue-200": status === "syncing",
          "bg-yellow-100 text-yellow-600 border-yellow-200": status === "pending",
          "bg-red-100 text-red-600 border-red-200": status === "rejected" || status === "error",
          "bg-gray-100 text-gray-600 border-gray-200": status === "ignored",
        },
        className,
      )}
    >
      <span className="mr-1">{getStatusIcon()}</span>
      <span>{getStatusText()}</span>
    </div>
  )
}

