"use client"

import { useState } from "react"
import { Wifi, WifiOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface ConnectionStatusProps {
  status: "connected" | "connecting" | "disconnected"
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [host, setHost] = useState("localhost")
  const [port, setPort] = useState("3000")

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
        return `Connected to ${host}:${port}`
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

  const handleConnect = () => {
    // In a real app, this would initiate a connection
    setIsDialogOpen(false)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={cn("flex items-center gap-2 py-4 px-2 h-auto w-full font-semibold", getButtonColors())}
        onClick={() => setIsDialogOpen(true)}
      >
        {getStatusIcon()}
        <span className="text-xs text-wrap">{getStatusText()}</span>
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connection Settings</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="host">Host</Label>
              <Input id="host" value={host} onChange={(e) => setHost(e.target.value)} placeholder="localhost" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="port">Port</Label>
              <Input id="port" value={port} onChange={(e) => setPort(e.target.value)} placeholder="3000" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConnect}>Connect</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

