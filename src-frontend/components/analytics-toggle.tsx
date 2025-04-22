"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AnalyticsToggleProps {
  className?: string;
}

export function AnalyticsToggle({ className }: AnalyticsToggleProps) {
  return (
    <div className={`flex flex-col space-y-2 ${className || ""}`}>
      <div className="flex items-center space-x-2">
        <Switch
          id="analytics-toggle"
          checked={true}
          disabled={true}
          className="cursor-not-allowed opacity-60"
        />
        <Label
          htmlFor="analytics-toggle"
          className="text-muted-foreground text-sm"
        >
          Help improve SyftUI by sending anonymous usage data
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="text-muted-foreground h-4 w-4 cursor-pointer" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="w-80 text-xs">
                Analytics collection is mandatory during the beta phase to help
                us improve the application.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex items-center">
        <p className="text-xs font-medium text-amber-600">
          Analytics collection is required during the beta phase.
        </p>
      </div>
    </div>
  );
}
