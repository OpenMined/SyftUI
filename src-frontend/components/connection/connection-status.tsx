"use client";

import { useState, useEffect } from "react";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  connectionFormSchema,
  ConnectionFormValues,
  useConnectionStore,
} from "@/stores";
import { ConnectionForm } from "@/components/connection/connection-form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ConnectionStatus() {
  const { settings, updateSettings, status, connect } = useConnectionStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Setup form with react-hook-form and zod validation
  const form = useForm<ConnectionFormValues>({
    resolver: zodResolver(connectionFormSchema),
    defaultValues: {
      url: settings.url,
      token: settings.token,
    },
  });

  // Sync form with connection settings
  useEffect(() => {
    form.setValue("url", settings.url);
    form.setValue("token", settings.token);
  }, [form, settings.url, settings.token]);

  // Handle form submission
  const onSubmit = async (values: ConnectionFormValues) => {
    // Update connection settings from form values
    updateSettings({
      url: values.url,
      token: values.token,
    });

    // Attempt connection
    const result = await connect();

    if (result.success) {
      setIsDialogOpen(false);
    } else {
      // Handle validation errors from the connection hook
      Object.entries(result.errors).forEach(([key, value]) => {
        if (value && key in values) {
          form.setError(key as keyof ConnectionFormValues, {
            type: "manual",
            message: value,
          });
        }
      });
    }
  };

  // Focus first input when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      form.setFocus("url");
    }
  }, [isDialogOpen, form]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isDialogOpen) {
      e.preventDefault();
      setIsDialogOpen(true);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "connected":
        return <Wifi className="h-4 w-4" />;
      case "connecting":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "disconnected":
        return <WifiOff className="h-4 w-4" />;
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
    }
  };

  const getButtonColors = () => {
    switch (status) {
      case "connected":
        return "bg-green-50 border-green-200 text-green-600 hover:bg-green-50 hover:border-green-200 hover:text-green-600";
      case "connecting":
        return "bg-yellow-50 border-yellow-200 text-yellow-600 hover:bg-yellow-50 hover:border-yellow-200 hover:text-yellow-600";
      case "disconnected":
        return "bg-red-50 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600";
    }
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "flex h-auto w-full cursor-pointer items-center gap-2 px-2 py-2 font-semibold select-none",
                getButtonColors(),
              )}
              onClick={() => setIsDialogOpen(true)}
              onMouseOver={() => setIsHovering(true)}
              onMouseOut={() => setIsHovering(false)}
              onKeyDown={handleKeyDown}
            >
              {getStatusIcon()}
              <span className="overflow-hidden text-xs text-ellipsis">
                {isHovering ? settings.url || getStatusText() : getStatusText()}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {getStatusText()} {status === "disconnected" ? "from" : "to"}{" "}
              {settings.url || "client"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connection Settings</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <ConnectionForm
              form={form}
              onSubmit={onSubmit}
              onCancel={() => setIsDialogOpen(false)}
              onSettingsChange={(key, value) =>
                updateSettings({ [key]: value })
              }
              status={status}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
