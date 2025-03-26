/**
 * Connection settings constants and types
 */
import { z } from "zod";

export interface ConnectionSettings {
  host: string;
  port: string | number;
  token: string;
}

export type ConnectionStatus = "connected" | "connecting" | "disconnected";

// Default values for connection settings
export const DEFAULT_CONNECTION_SETTINGS: ConnectionSettings = {
  host: "localhost",
  port: "3000",
  token: "2b280fc73335d39427183bed28fead26d865a5c1",
};

// Key used for storing connection settings in session storage
export const CONNECTION_STORAGE_KEY = 'connectionSettings';


// Connection simulation
export const SIMULATED_CONNECTION_DELAY = 750; // ms

// Form schema for connection settings validation
export const connectionFormSchema = z.object({
  host: z.string().min(1, "Host is required").regex(/^[a-zA-Z0-9.-]+$/, "Invalid host"),
  port: z.preprocess(
    (value) => parseInt(z.string().parse(value), 10),
    z.number().min(1, "Port is required").max(65535, "Port must be between 1 and 65535")
  ),
  token: z.string().length(40, "Token must be exactly 40 characters"),
});

// Type for form values
export type ConnectionFormValues = z.infer<typeof connectionFormSchema>;
