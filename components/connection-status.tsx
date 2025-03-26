"use client"

import { useState, useRef, useEffect } from "react"
import { Wifi, WifiOff, Loader2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface ConnectionStatusProps {
  status: "connected" | "connecting" | "disconnected"
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const [currentStatus, setCurrentStatus] = useState(status)
  const [host, setHost] = useState("localhost")
  const [port, setPort] = useState("3000")
  const [token, setToken] = useState("2b280fc73335d39427183bed28fead26d865a5c1")
  const [displayHost, setDisplayHost] = useState(host)
  const [displayPort, setDisplayPort] = useState(port)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [errors, setErrors] = useState({ host: "", port: "", token: "" })
  const [showToken, setShowToken] = useState(false)
  const [hasSummaryFocus, setHasSummaryFocus] = useState(false)
  const initialFocusRef = useRef<HTMLInputElement>(null)
  const hostInputRef = useRef<HTMLInputElement>(null)
  const portInputRef = useRef<HTMLInputElement>(null)
  const tokenInputRef = useRef<HTMLInputElement>(null)
  const connectButtonRef = useRef<HTMLButtonElement>(null)

  // Session storage utilities
  const saveToSessionStorage = (key: string, value: any) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to sessionStorage:', error);
    }
  };

  const getFromSessionStorage = (key: string) => {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from sessionStorage:', error);
      return null;
    }
  };

  // Focus first input when dialog opens
  useEffect(() => {
    if (isDialogOpen && hostInputRef.current) {
      setTimeout(() => {
        hostInputRef.current?.focus()
      }, 100)
    }
  }, [isDialogOpen])

  // Load saved connection from sessionStorage
  useEffect(() => {
    const savedConnection = getFromSessionStorage('connectionSettings');
    if (savedConnection) {
      try {
        const { host: savedHost, port: savedPort, token: savedToken } = savedConnection;
        if (savedHost) { setHost(savedHost); setDisplayHost(savedHost); }
        if (savedPort) { setPort(savedPort); setDisplayPort(savedPort); }
        if (savedToken) setToken(savedToken);
      } catch (error) {
        console.error('Failed to parse saved connection', error);
      }
    }
  }, []);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleConnect()
    }
  }

  // Save connection to sessionStorage
  const saveConnection = () => {
    saveToSessionStorage('connectionSettings', { host, port, token });
  };

  const getStatusIcon = () => {
    switch (currentStatus) {
      case "connected":
        return <Wifi className="h-4 w-4" />
      case "connecting":
        return <Loader2 className="h-4 w-4 animate-spin" />
      case "disconnected":
        return <WifiOff className="h-4 w-4" />
    }
  }


  const getStatusText = () => {
    switch (currentStatus) {
      case "connected":
        return `Connected to ${displayHost}:${displayPort}`
      case "connecting":
        return `Connecting...`
      case "disconnected":
        return "Disconnected"
    }
  }

  const getButtonColors = () => {
    switch (currentStatus) {
      case "connected":
        return "bg-green-50 border-green-200 text-green-600 hover:bg-green-100 hover:border-green-300 hover:text-green-700"
      case "connecting":
        return "bg-yellow-50 border-yellow-200 text-yellow-600 hover:bg-yellow-100 hover:border-yellow-300 hover:text-yellow-700"
      case "disconnected":
        return "bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 hover:text-red-700"
    }
  }

  const validateForm = () => {
    const newErrors = { host: "", port: "", token: "" }

    // Host validation
    if (!host.trim()) {
      newErrors.host = "Host is required"
    } else if (!/^[a-zA-Z0-9.-]+$/.test(host)) {
      newErrors.host = "Invalid host format"
    }

    // Port validation
    if (!port.trim()) {
      newErrors.port = "Port is required"
    } else if (!/^\d+$/.test(port)) {
      newErrors.port = "Port must be a number"
    } else if (parseInt(port) < 1 || parseInt(port) > 65535) {
      newErrors.port = "Port must be between 1 and 65535"
    }

    // Token validation (must be exactly 40 characters)
    if (!token) {
      newErrors.token = "Token is required"
    } else if (token.length !== 40) {
      newErrors.token = "Invalid token. Token must be exactly 40 characters"
    }

    setErrors(newErrors)
    const isValid = !newErrors.host && !newErrors.port && !newErrors.token
    return isValid
  }

  const handleConnect = () => {
    // Validate before connecting
    const formIsValid = validateForm()
    if (formIsValid) {
      // In a real app, this would initiate a connection
      setCurrentStatus("connecting")
      setIsDialogOpen(false)
      setTimeout(() => {
        saveConnection()
        setDisplayHost(host)
        setDisplayPort(port)
        setCurrentStatus("connected")
      }, 750)
    } else {
      // Set focus to first error summary when there are errors
      setHasSummaryFocus(true)
    }
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
        <DialogContent onKeyDown={handleKeyDown}>
          <DialogHeader>
            <DialogTitle>Connection Settings</DialogTitle>
          </DialogHeader>

          {/* Error Summary for keyboard users */}
          {(errors.host || errors.port || errors.token) && (
            <div
              className="p-3 bg-red-50 border border-red-200 rounded mb-4 text-red-700"
              tabIndex={0}
              role="alert"
              aria-atomic="true"
              aria-labelledby="error-summary-title"
              ref={hasSummaryFocus ? (el) => el?.focus() : null}
              onFocus={() => setHasSummaryFocus(false)}
            >
              <h3 id="error-summary-title" className="text-sm font-semibold">Please fix the following errors:</h3>
              <ul className="list-disc ml-5 text-xs mt-1">
                {errors.host && <li>{errors.host}</li>}
                {errors.port && <li>{errors.port}</li>}
                {errors.token && <li>{errors.token}</li>}
              </ul>
            </div>
          )}
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="host">Host</Label>
              <Input
                id="host"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="localhost"
                className={errors.host ? "border-red-500" : ""}
                aria-invalid={!!errors.host}
                aria-describedby={errors.host ? "host-error" : undefined}
                ref={hostInputRef}
              />
              {errors.host && <p id="host-error" className="text-red-500 text-xs mt-1">{errors.host}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="3000"
                type="number"
                className={errors.port ? "border-red-500" : ""}
                aria-invalid={!!errors.port}
                aria-describedby={errors.port ? "port-error" : undefined}
                ref={portInputRef}
              />
              {errors.port && <p id="port-error" className="text-red-500 text-xs mt-1">{errors.port}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="token">Token</Label>
              <div className="relative">
                <Input
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste your token here"
                  type={showToken ? "text" : "password"}
                  className={errors.token ? "border-red-500 pr-10" : "pr-10"}
                  aria-invalid={!!errors.token}
                  aria-describedby={errors.token ? "token-error" : undefined}
                  ref={tokenInputRef}
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showToken ? "Hide token" : "Show token"}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.token && <p id="token-error" className="text-red-500 text-xs mt-1">{errors.token}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConnect} ref={connectButtonRef}>
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

