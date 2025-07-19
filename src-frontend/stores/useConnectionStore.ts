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

export type DatasiteStatus =
  | "UNPROVISIONED"
  | "PROVISIONING"
  | "PROVISIONED"
  | "ERROR";

export const isConfigValid = (status: DatasiteStatus | undefined) =>
  status && ["PROVISIONING", "PROVISIONED"].includes(status);

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

export interface DatasiteInfo {
  status: DatasiteStatus;
  error: string | null;
  email: string | null;
}

interface ConnectionState {
  settings: ConnectionSettings;
  status: ConnectionStatus;
  datasite: DatasiteInfo | null;
  updateSettings: (newSettings: Partial<ConnectionSettings>) => void;
  setStatus: (status: ConnectionStatus) => void;
  connect: () => Promise<{
    success: boolean;
    errors: ConnectionErrors;
  }>;
  validateSettings: (settings: ConnectionSettings) => ConnectionErrors;
}

// Use Zustand's persist middleware to store connection settings in sessionStorage
export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_CONNECTION_SETTINGS,
      status: "disconnected",
      datasite: null,

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
        result.error.issues.forEach((err: z.ZodIssue) => {
          const path = err.path[0] as keyof ConnectionErrors;
          errors[path] = err.message;
        });

        return errors;
      },

      connect: async () => {
        const { settings, validateSettings } = get();

        let errors = validateSettings(settings);
        let success = false;

        // Check if there are any errors
        if (Object.keys(errors).length === 0) {
          set({ status: "connecting" });

          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

            const response = await fetch(`${settings.url}/v1/status`, {
              headers: {
                Authorization: `Bearer ${settings.token}`,
              },
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok) {
              set({ status: "connected" });
              const responseData = await response.json();
              success = true;
              set({
                datasite: {
                  status: responseData.datasite.status,
                  error: responseData.datasite.error || null,
                  email: responseData.datasite.config?.email || null,
                },
              });
            } else {
              set({ status: "disconnected" });
              switch (response.status) {
                case 401:
                  errors = { token: "Invalid token" };
                  break;
                case 403:
                  errors = {
                    token: "Token does not have required permissions",
                  };
                  break;
                case 404:
                  errors = { url: "Endpoint not found" };
                  break;
                case 500:
                  errors = { url: "Server error" };
                  break;
                default:
                  errors = {
                    url: `Connection failed with status ${response.status}`,
                  };
              }
            }
          } catch (err) {
            set({ status: "disconnected" });
            if (err instanceof Error) {
              if (err.name === "AbortError") {
                errors = { url: "Connection timed out" };
              } else if (
                err.name === "TypeError" &&
                err.message.includes("Failed to fetch")
              ) {
                errors = {
                  url: "Invalid URL - check your connection or client URL",
                };
              } else if (
                err.name === "TypeError" &&
                err.message.includes("CORS")
              ) {
                errors = {
                  url: "CORS error - check server configuration",
                };
              } else {
                errors = { url: "An unexpected error occurred" };
              }
            }
          }
        }

        return { success, errors };
      },
    }),
    {
      name: CONNECTION_STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => {
        // Only persist settings when valid
        return state.settings.url !== "" && state.settings.token !== ""
          ? { settings: state.settings }
          : {};
      },
    },
  ),
);
