"use client"
import React from "react"
import { AlertTriangle, Check, Loader2, Monitor, Server, SquareTerminal, X, type LucideIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { ConnectionStatus, NetworkTopology, Node as NetworkNode } from "@/components/diagnostic/diagnostic"

interface NetworkTopologyCardProps {
  topology?: NetworkTopology
  className?: string
}

const statusConfig: Record<ConnectionStatus, { icon: LucideIcon; color: string; tooltip: string }> = {
  connected: {
    icon: Check,
    color: "bg-green-500 dark:bg-green-600",
    tooltip: "Connected and working properly",
  },
  connecting: {
    icon: Loader2,
    color: "bg-blue-500 dark:bg-blue-600",
    tooltip: "Establishing connection",
  },
  disconnected: {
    icon: X,
    color: "bg-red-500 dark:bg-red-600",
    tooltip: "Connection failed or disconnected",
  },
  degraded: {
    icon: AlertTriangle,
    color: "bg-yellow-500 dark:bg-yellow-600",
    tooltip: "Connected with limited functionality or performance issues",
  },
}

// Default network topology
const defaultTopology: NetworkTopology = {
  nodes: [
    {
      id: "frontend",
      name: "SyftUI",
      icon: Monitor,
      tooltip: "The frontend application running in your browser",
      address: "127.0.0.1:3000",
    },
    {
      id: "client",
      name: "SyftBox CLI",
      icon: SquareTerminal,
      tooltip: "Local client running in your terminal",
      address: "127.0.0.1:8080",
    },
    {
      id: "server",
      name: "SyftBox Server",
      icon: Server,
      tooltip: "Cache server running in the cloud",
      address: "syftbox.openmined.org",
    },
  ],
  connections: [
    {
      id: "frontend-client",
      sourceId: "frontend",
      targetId: "client",
      status: "connected",
      latency: 4,
    },
    {
      id: "client-server",
      sourceId: "client",
      targetId: "server",
      status: "disconnected",
      latency: 24,
    },
  ],
}

export function NetworkTopologyCard({ topology, className }: NetworkTopologyCardProps) {
  const { nodes, connections } = topology ?? defaultTopology

  // Find connection between two nodes
  const findConnection = (sourceId: string, targetId: string) => {
    return connections.find(
      (conn) =>
        (conn.sourceId === sourceId && conn.targetId === targetId) ||
        (conn.sourceId === targetId && conn.targetId === sourceId),
    )
  }

  const isFullyConnected = connections.every((conn) => conn.status === "connected")

  // Calculate total ping latency when all connections are active
  const calculateAveragePing = () => {
    if (!isFullyConnected) return null;
    const totalLatency = connections.reduce((acc, conn) => acc + (conn.latency || 0), 0)
  };

  const averagePing = calculateAveragePing();

  return (
    <TooltipProvider>
      <Card className={cn("flex flex-col w-full overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Network status</CardTitle>
              <CardDescription>System connection topology</CardDescription>
            </div>
            <div className="text-3xl font-bold">
              {isFullyConnected ? (
                <span className="text-green-500 dark:text-green-400">{averagePing}ms</span>
              ) : (
                <span className="text-red-500 dark:text-red-400">Offline</span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 flex-1">
          <div className="h-full w-full flex items-center justify-between">
            {/* Network topology visualization */}
            {nodes.map((node, index) => (
              <React.Fragment key={node.id}>
                {/* Node */}
                <NodeItem node={node} />

                {/* Connection line to the next node */}
                {index < nodes.length - 1 && (
                  <div className="flex-1 flex items-center justify-center">
                    <ConnectionLine
                      connection={findConnection(node.id, nodes[index + 1].id)}
                      isLast={index === nodes.length - 2}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 pt-4 text-sm">
          <div className="leading-none text-muted-foreground">
            Last updated {new Date().toLocaleTimeString()} •
            {isFullyConnected
              ? ` All systems operational`
              : ` ${connections.filter(k => k.status !== "connected").length} connection issues detected`}
          </div>
          {!isFullyConnected && (
            <div className="text-xs text-red-500 dark:text-red-400">
              Connection issues may affect application performance. Raise an issue if problems persist.
            </div>
          )}
        </CardFooter>
      </Card>
    </TooltipProvider>
  )
}

interface NodeItemProps {
  node: NetworkNode
}

function NodeItem({ node }: NodeItemProps) {
  const { name, icon: Icon, tooltip, address } = node

  return (
    <div className="flex flex-col items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-32 h-32 flex flex-col items-center justify-center border rounded-lg p-4 bg-card">
            <Icon className="w-12 h-12 mb-2" />
            <div className="text-md text-center text-nowrap font-medium">{name}</div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
      <div className="mt-2 text-xs text-muted-foreground">{address}</div>
    </div>
  )
}

interface ConnectionLineProps {
  connection?: {
    status: ConnectionStatus
    latency?: number
  }
  isLast: boolean
}

function ConnectionLine({ connection, isLast }: ConnectionLineProps) {
  if (!connection) return null

  const { status, latency } = connection
  const { icon: StatusIcon, color, tooltip } = statusConfig[status]

  return (
    <div className="flex flex-col items-center w-full">
      {/* Latency indicator */}
      <div className="text-sm text-muted-foreground mb-1">{latency ? `${latency} ms` : "— ms"}</div>

      {/* Connection line */}
      <div className="flex items-center w-full">
        <div className="h-px bg-border flex-1" />
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center mx-2", color)}>
              <StatusIcon className={cn("w-5 h-5 text-white", status === "connecting" && "animate-spin")} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
        <div className="h-px bg-border flex-1" />
      </div>
    </div>
  )
}
