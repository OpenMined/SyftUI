"use client";
import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  Loader2,
  Monitor,
  Server,
  SquareTerminal,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  ConnectionStatus,
  NetworkTopology,
  Node as NetworkNode,
} from "@/components/diagnostic/diagnostic";

interface NetworkTopologyCardProps {
  topology?: NetworkTopology;
  className?: string;
}

const statusConfig: Record<
  ConnectionStatus,
  { icon: LucideIcon; color: string; tooltip: string }
> = {
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
};

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
};

export function NetworkTopologyCard({
  topology,
  className,
}: NetworkTopologyCardProps) {
  const { nodes, connections } = topology ?? defaultTopology;
  const [currentConnections, setCurrentConnections] = useState(connections);

  useEffect(() => {
    // Simulate connection status and latency changes every 5 seconds
    const interval = setInterval(() => {
      setCurrentConnections((prevConnections) => {
        const isAllConnected = Math.random() < 0.5; // 50% chance for all connections to be connected
        return prevConnections.map((conn) => {
          const randomStatus = isAllConnected
            ? "connected"
            : ["connected", "connecting", "disconnected", "degraded"][
                Math.floor(Math.random() * 4)
              ];
          const randomLatency =
            randomStatus === "connected"
              ? Math.floor(Math.random() * 100) + 1
              : null;
          return {
            ...conn,
            status: randomStatus,
            latency: randomLatency,
          };
        });
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Find connection between two nodes
  const findConnection = (sourceId: string, targetId: string) => {
    return currentConnections.find(
      (conn) =>
        (conn.sourceId === sourceId && conn.targetId === targetId) ||
        (conn.sourceId === targetId && conn.targetId === sourceId),
    );
  };

  const isFullyConnected = currentConnections.every(
    (conn) => conn.status === "connected",
  );

  // Calculate total ping latency when all connections are active
  const calculateTotalPing = () => {
    if (!isFullyConnected) return null;
    const totalLatency = currentConnections.reduce(
      (acc, conn) => acc + (conn.latency || 0),
      0,
    );
    return Math.round(totalLatency);
  };

  const totalPing = calculateTotalPing();

  return (
    <TooltipProvider>
      <Card className={cn("flex w-full flex-col overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Network status</CardTitle>
              <CardDescription>System connection topology</CardDescription>
            </div>
            <Tooltip>
              <TooltipTrigger>
                <div className="text-3xl font-bold">
                  {isFullyConnected ? (
                    <span className="text-green-500 dark:text-green-400">
                      {totalPing}ms
                    </span>
                  ) : (
                    <span className="text-red-500 dark:text-red-400">
                      Offline
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total ping latency</p>
                <p className="text-muted-foreground text-sm">
                  {isFullyConnected
                    ? `Total latency across all connections: ${totalPing} ms`
                    : "Not all connections are active"}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-6">
          <div className="flex h-full w-full items-center justify-between">
            {/* Network topology visualization */}
            {nodes.map((node, index) => (
              <React.Fragment key={node.id}>
                {/* Node */}
                <NodeItem node={node} />

                {/* Connection line to the next node */}
                {index < nodes.length - 1 && (
                  <div className="flex flex-1 items-center justify-center">
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
          <div className="text-muted-foreground leading-none">
            Last updated {new Date().toLocaleTimeString()} •
            {isFullyConnected
              ? ` All systems operational`
              : ` ${currentConnections.filter((k) => k.status !== "connected").length} connection issues detected`}
          </div>
          {!isFullyConnected && (
            <div className="text-xs text-red-500 dark:text-red-400">
              Connection issues may affect application performance. Raise an
              issue if problems persist.
            </div>
          )}
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}

interface NodeItemProps {
  node: NetworkNode;
}

function NodeItem({ node }: NodeItemProps) {
  const { name, icon: Icon, tooltip, address } = node;

  return (
    <div className="flex flex-col items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="bg-card flex h-32 w-32 flex-col items-center justify-center rounded-lg border p-4">
            <Icon className="mb-2 h-12 w-12" />
            <div className="text-md text-center font-medium text-nowrap">
              {name}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
      <div className="text-muted-foreground mt-2 text-xs">{address}</div>
    </div>
  );
}

interface ConnectionLineProps {
  connection?: {
    status: ConnectionStatus;
    latency?: number;
  };
}

function ConnectionLine({ connection }: ConnectionLineProps) {
  if (!connection) return null;

  const { status, latency } = connection;
  const { icon: StatusIcon, color, tooltip } = statusConfig[status];

  return (
    <div className="flex w-full flex-col items-center">
      {/* Latency indicator */}
      <div className="text-muted-foreground mb-1 text-sm">
        {latency ? `${latency} ms` : "— ms"}
      </div>

      {/* Connection line */}
      <div className="flex w-full items-center">
        <div className="bg-border h-px flex-1" />
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "mx-2 flex h-8 w-8 items-center justify-center rounded-full",
                color,
              )}
            >
              <StatusIcon
                className={cn(
                  "h-5 w-5 text-white",
                  status === "connecting" && "animate-spin",
                )}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
        <div className="bg-border h-px flex-1" />
      </div>
    </div>
  );
}
