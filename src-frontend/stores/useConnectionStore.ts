"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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
export const CONNECTION_STORAGE_KEY = "connectionSettings";

// Connection simulation
export const SIMULATED_CONNECTION_DELAY = 750; // ms

// Form schema for connection settings validation
export const connectionFormSchema = z.object({
  url: z.string().min(1, "URL is required").url("Must be a valid URL"),
  token: z.string().length(40, "Token must be exactly 40 characters long"),
});

// Type for form values
export type ConnectionFormValues = z.infer<typeof connectionFormSchema>;

export interface ConnectionErrors {
  url?: string;
  token?: string;
}

interface ConnectionState {
  settings: ConnectionSettings;
  displayUrl: string;
  status: ConnectionStatus;
  updateSettings: (newSettings: Partial<ConnectionSettings>) => void;
  setStatus: (status: ConnectionStatus) => void;
  connect: () => { success: boolean; errors: ConnectionErrors };
  validateSettings: (settings: ConnectionSettings) => ConnectionErrors;
}

// Use Zustand's persist middleware to store connection settings in sessionStorage
export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_CONNECTION_SETTINGS,
      displayUrl: DEFAULT_CONNECTION_SETTINGS.url,
      status: "disconnected",

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      setStatus: (status) => {
        set({ status });
      },

      validateSettings: (settings) => {
        // Convert settings to the format expected by zod schema
        const result = connectionFormSchema.safeParse({
          url: settings.url,
          token: settings.token,
        });

        if (result.success) {
          return {};
        }

        // Convert zod errors to our error format
        const errors: ConnectionErrors = {};
        result.error.errors.forEach((err) => {
          const path = err.path[0] as keyof ConnectionErrors;
          errors[path] = err.message;
        });

        return errors;
      },

      connect: () => {
        const { settings, validateSettings } = get();
        const errors = validateSettings(settings);

        // Check if there are any errors
        if (Object.keys(errors).length === 0) {
          set({ status: "connecting" });

          // Simulate connection attempt
          setTimeout(() => {
            set({
              displayUrl: settings.url,
              status: "connected",
            });
          }, SIMULATED_CONNECTION_DELAY);

          return { success: true, errors: {} };
        }

        return { success: false, errors };
      },
    }),
    {
      name: CONNECTION_STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
