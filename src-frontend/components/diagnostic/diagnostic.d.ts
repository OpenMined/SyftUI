import type { LucideIcon } from "lucide-react";

export type ConnectionStatus =
  | "connected"
  | "connecting"
  | "disconnected"
  | "degraded";

export interface Node {
  id: string;
  name: string;
  icon: LucideIcon;
  tooltip: string;
  address: string;
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  status: ConnectionStatus;
  latency?: number; // in milliseconds
}

export interface NetworkTopology {
  nodes: Node[];
  connections: Connection[];
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  topology: NetworkTopology;
}
