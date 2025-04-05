import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FloatingConnectionStatusProps {
  status: "connected" | "connecting" | "disconnected";
  url?: string;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  className?: string;
}

export function FloatingConnectionStatus({
  status,
  url,
  position = "bottom-right",
  className = "",
}: FloatingConnectionStatusProps) {
  const [isHovering, setIsHovering] = useState(false);
  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  };

  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "bg-green-500";
      case "connecting":
        return "bg-yellow-500";
      case "disconnected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "disconnected":
        return "Disconnected";
      default:
        return "";
    }
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <div className="bg-background rounded-full border p-1 shadow-lg">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                className="focus:outline-none"
                aria-label={`${getStatusText()} to ${url}`}
              >
                <div
                  className={`flex items-center gap-1.5 px-2 py-1 ${className}`}
                >
                  <div
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      getStatusColor(),
                      status !== "connected" ? "animate-pulse" : "",
                    )}
                  />
                  <span className="text-xs font-medium">
                    {isHovering ? url : getStatusText()}
                  </span>
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {getStatusText()} {status === "disconnected" ? "from" : "to"}{" "}
                {url}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
