"use client"

import { useState, useEffect } from "react";
import { saveToSessionStorage, getFromSessionStorage } from "@/lib/storage/session-storage";
import { 
  ConnectionSettings, 
  ConnectionStatus, 
  DEFAULT_CONNECTION_SETTINGS, 
  CONNECTION_STORAGE_KEY,
  SIMULATED_CONNECTION_DELAY,
  connectionFormSchema
} from "./constants";

export interface ConnectionErrors {
  host?: string;
  port?: string;
  token?: string;
}

/**
 * Hook for managing connection settings and status
 */
export function useConnection() {
  // State for connection settings and display values
  const [settings, setSettings] = useState<ConnectionSettings>(DEFAULT_CONNECTION_SETTINGS);
  const [displayHost, setDisplayHost] = useState(settings.host);
  const [displayPort, setDisplayPort] = useState(settings.port);
  
  // Connection status
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

  return {
    settings,
    updateSettings,
    status,
    setStatus,
    displayHost,
    displayPort,
    connect,
    validateSettings
  };
}
