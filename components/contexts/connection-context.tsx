"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { saveToSessionStorage, getFromSessionStorage } from "@/lib/storage/session-storage";
import { z } from "zod";

// Connection settings types and constants
export interface ConnectionSettings {
  url: string;
  token: string;
}

export type ConnectionStatus = "connected" | "connecting" | "disconnected";

// Default values for connection settings
export const DEFAULT_CONNECTION_SETTINGS: ConnectionSettings = {
  url: "http://127.0.0.1:8080/",
  token: "2b280fc73335d39427183bed28fead26d865a5c1",
};

// Key used for storing connection settings in session storage
export const CONNECTION_STORAGE_KEY = 'connectionSettings';

// Connection simulation
export const SIMULATED_CONNECTION_DELAY = 750; // ms

// Form schema for connection settings validation
export const connectionFormSchema = z.object({
  url: z.string().min(1, "URL is required").url("Must be a valid URL"),
  token: z.string().min(1, "Token is required"),
});

// Type for form values
export type ConnectionFormValues = z.infer<typeof connectionFormSchema>;

export interface ConnectionErrors {
  url?: string;
  token?: string;
}

interface ConnectionContextType {
  settings: ConnectionSettings;
  updateSettings: (newSettings: Partial<ConnectionSettings>) => void;
  status: ConnectionStatus;
  setStatus: (status: ConnectionStatus) => void;
  displayUrl: string;
  connect: () => { success: boolean; errors: ConnectionErrors };
  validateSettings: (settings: ConnectionSettings) => ConnectionErrors;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ConnectionSettings>(DEFAULT_CONNECTION_SETTINGS);
  const [displayUrl, setDisplayUrl] = useState(settings.url);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  // Load saved connection from sessionStorage
  useEffect(() => {
    const savedConnection = getFromSessionStorage(CONNECTION_STORAGE_KEY);
    if (savedConnection) {
      try {
        const { url, token } = savedConnection as ConnectionSettings;
        const newSettings = { ...settings };

        if (url) {
          newSettings.url = url;
          setDisplayUrl(url);
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
      url: settings.url,
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
        setDisplayUrl(settings.url);
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
        displayUrl,
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
