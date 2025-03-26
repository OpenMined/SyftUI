"use client"

import { useState, useEffect } from "react"
import { Wifi, WifiOff, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { ConnectionStatus as StatusType, DEFAULT_CONNECTION_SETTINGS, connectionFormSchema, ConnectionFormValues } from "@/lib/connection/constants"
import { useConnection } from "@/lib/connection/use-connection"
import { ConnectionForm } from "@/components/connection/connection-form"

interface ConnectionStatusProps {
  initialStatus?: StatusType;
  onStatusChange?: (status: StatusType) => void;
}

export function ConnectionStatus({ 
  initialStatus, 
  onStatusChange 
}: ConnectionStatusProps) {
  const {
    settings,
    updateSettings,
    status,
    setStatus,
    displayHost,
    displayPort,
    connect
  } = useConnection();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Setup form with react-hook-form and zod validation
  const form = useForm<ConnectionFormValues>({
    resolver: zodResolver(connectionFormSchema),
    defaultValues: {
      host: DEFAULT_CONNECTION_SETTINGS.host,
      port: DEFAULT_CONNECTION_SETTINGS.port,
      token: DEFAULT_CONNECTION_SETTINGS.token,
    },
  });

  // Handle initial status if provided
  useEffect(() => {
    if (initialStatus) {
      setStatus(initialStatus);
    }
  }, [initialStatus, setStatus]);

  // Notify parent component about status changes
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(status);
    }
  }, [status, onStatusChange]);

  // Sync form with connection settings
  useEffect(() => {
    form.setValue("host", settings.host);
    form.setValue("port", settings.port as string);
    form.setValue("token", settings.token);
  }, [form, settings]);

  // Handle form submission
  function onSubmit(values: ConnectionFormValues) {
    // Update connection settings from form values
    updateSettings({
      host: values.host,
      port: values.port.toString(),
      token: values.token
    });
    
    // Attempt connection
    const result = connect();
    
    if (result.success) {
      setIsDialogOpen(false);
    } else {
      // Handle validation errors from the connection hook
      Object.entries(result.errors).forEach(([key, value]) => {
        if (value && key in values) {
          form.setError(key as keyof ConnectionFormValues, {
            type: "manual",
            message: value
          });
        }
      });
    }
  }

  // Focus first input when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      form.setFocus("host");
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
        return <Wifi className="h-4 w-4" />
      case "connecting":
        return <Loader2 className="h-4 w-4 animate-spin" />
      case "disconnected":
        return <WifiOff className="h-4 w-4" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case "connected":
        return `Connected to ${displayHost}:${displayPort}`
      case "connecting":
        return `Connecting...`
      case "disconnected":
        return "Disconnected"
    }
  }

  const getButtonColors = () => {
    switch (status) {
      case "connected":
        return "bg-green-50 border-green-200 text-green-600 hover:bg-green-100 hover:border-green-300 hover:text-green-700"
      case "connecting":
        return "bg-yellow-50 border-yellow-200 text-yellow-600 hover:bg-yellow-100 hover:border-yellow-300 hover:text-yellow-700"
      case "disconnected":
        return "bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 hover:text-red-700"
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={cn("flex items-center gap-2 py-4 px-2 h-auto w-full font-semibold", getButtonColors())}
        onClick={() => setIsDialogOpen(true)}
        onKeyDown={handleKeyDown}
      >
        {getStatusIcon()}
        <span className="text-xs text-wrap">{getStatusText()}</span>
      </Button>

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
              onSettingsChange={(key, value) => updateSettings({ [key]: value })}
              status={status}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
