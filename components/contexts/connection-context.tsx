"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { saveToSessionStorage, getFromSessionStorage } from "@/lib/storage/session-storage";
import { z } from "zod";

// Connection settings types and constants
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

export interface ConnectionErrors {
  host?: string;
  port?: string;
  token?: string;
}

interface ConnectionContextType {
  settings: ConnectionSettings;
  updateSettings: (newSettings: Partial<ConnectionSettings>) => void;
  status: ConnectionStatus;
  setStatus: (status: ConnectionStatus) => void;
  displayHost: string;
  displayPort: string | number;
  connect: () => { success: boolean; errors: ConnectionErrors };
  validateSettings: (settings: ConnectionSettings) => ConnectionErrors;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ConnectionSettings>(DEFAULT_CONNECTION_SETTINGS);
  const [displayHost, setDisplayHost] = useState(settings.host);
  const [displayPort, setDisplayPort] = useState(settings.port);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  // Load saved connection from sessionStorage
  useEffect(() => {
    const savedConnection = getFromSessionStorage(CONNECTION_STORAGE_KEY);
    if (savedConnection) {
      try {
        const { host, port, token } = savedConnection as ConnectionSettings;
        const newSettings = { ...settings };

        if (host) {
          newSettings.host = host;
          setDisplayHost(host);
        }

        if (port) {
          newSettings.port = port;
          setDisplayPort(port);
        }

        if (token) {
          newSettings.token = token;
        }

        setSettings(newSettings);
      } catch (error) {
        console.error('Failed to parse saved connection', error);
      }
    }
  }, []);

  // Validate connection settings using zod schema
  const validateSettings = (settings: ConnectionSettings): ConnectionErrors => {
    // Convert settings to the format expected by zod schema
    const result = connectionFormSchema.safeParse({
      host: settings.host,
      port: settings.port,
      token: settings.token
    });

    if (result.success) {
      return {};
    }

    // Convert zod errors to our error format
    const errors: ConnectionErrors = {};
    result.error.errors.forEach(err => {
      const path = err.path[0] as keyof ConnectionErrors;
      errors[path] = err.message;
    });

    return errors;
  };

  // Update connection settings
  const updateSettings = (newSettings: Partial<ConnectionSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Connect with the current settings
  const connect = () => {
    const errors = validateSettings(settings);

    // Check if there are any errors
    if (Object.keys(errors).length === 0) {
      setStatus("connecting");

      // Simulate connection attempt
      setTimeout(() => {
        saveToSessionStorage(CONNECTION_STORAGE_KEY, settings);
        setDisplayHost(settings.host);
        setDisplayPort(settings.port);
        setStatus("connected");
      }, SIMULATED_CONNECTION_DELAY);

      return { success: true, errors: {} };
    }

    return { success: false, errors };
  };

  return (
    <ConnectionContext.Provider
      value={{
        settings,
        updateSettings,
        status,
        setStatus,
        displayHost,
        displayPort,
        connect,
        validateSettings
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);

  if (context === undefined) {
    throw new Error("useConnection must be used within a ConnectionProvider");
  }

  return context;
}
