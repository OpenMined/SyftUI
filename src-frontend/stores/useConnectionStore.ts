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
  url: "",
  token: "",
};

// Key used for storing connection settings in session storage
export const CONNECTION_STORAGE_KEY = "connectionSettings";

// Form schema for connection settings validation
export const connectionFormSchema = z.object({
  url: z.string().min(1, "URL is required").url("Must be a valid URL"),
  token: z.string().length(32, "Must be a valid token"),
});

// Type for form values
export type ConnectionFormValues = z.infer<typeof connectionFormSchema>;

export interface ConnectionErrors {
  url?: string;
  token?: string;
}

interface ConnectionState {
  settings: ConnectionSettings;
  status: ConnectionStatus;
  updateSettings: (newSettings: Partial<ConnectionSettings>) => void;
  setStatus: (status: ConnectionStatus) => void;
  connect: () => Promise<{ success: boolean; errors: ConnectionErrors }>;
  validateSettings: (settings: ConnectionSettings) => ConnectionErrors;
}

// Use Zustand's persist middleware to store connection settings in sessionStorage
export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_CONNECTION_SETTINGS,
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

      connect: async () => {
        const { settings, validateSettings } = get();
        const errors = validateSettings(settings);

        // Check if there are any errors
        if (Object.keys(errors).length === 0) {
          set({ status: "connecting" });

          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch(`${settings.url}/v1/status`, {
              headers: {
                Authorization: `Bearer ${settings.token}`,
              },
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok) {
              set({ status: "connected" });
              return { success: true, errors: {} };
            } else {
              set({ status: "disconnected" });
              switch (response.status) {
                case 401:
                  return { success: false, errors: { token: "Invalid token" } };
                case 403:
                  return {
                    success: false,
                    errors: {
                      token: "Token does not have required permissions",
                    },
                  };
                case 404:
                  return {
                    success: false,
                    errors: { url: "Endpoint not found" },
                  };
                case 500:
                  return { success: false, errors: { url: "Server error" } };
                default:
                  return {
                    success: false,
                    errors: {
                      url: `Connection failed with status ${response.status}`,
                    },
                  };
              }
            }
          } catch (error) {
            set({ status: "disconnected" });
            if (error instanceof Error) {
              if (error.name === "AbortError") {
                return {
                  success: false,
                  errors: { url: "Connection timed out" },
                };
              }
              if (
                error.name === "TypeError" &&
                error.message.includes("Failed to fetch")
              ) {
                return {
                  success: false,
                  errors: {
                    url: "Invalid URL - check your connection or client URL",
                  },
                };
              }
              if (
                error.name === "TypeError" &&
                error.message.includes("CORS")
              ) {
                return {
                  success: false,
                  errors: { url: "CORS error - check server configuration" },
                };
              }
            }
            return {
              success: false,
              errors: { url: "An unexpected error occurred" },
            };
          }
        }

        return { success: false, errors };
      },
    }),
    {
      name: CONNECTION_STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => {
        // Only persist settings when connected
        return state.status === "connected" ? { settings: state.settings } : {};
      },
    },
  ),
);
