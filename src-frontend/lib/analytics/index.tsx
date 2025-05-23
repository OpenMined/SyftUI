import React, { createContext, useContext, ReactNode } from "react";
import { AptabaseProvider, useAptabase } from "@aptabase/react";

// Define standard event categories
export type EventCategory =
  | "ui" // User interface events
  | "auth" // Authentication events
  | "data" // Data operations
  | "system"; // System events

// Define standard actions for each category
export type EventAction =
  | "view" // Viewing something
  | "click" // Clicking something
  | "submit" // Submitting a form
  | "create" // Creating something
  | "update" // Updating something
  | "delete" // Deleting something
  | "error" // Error occurred
  | "success"; // Operation succeeded

// Analytics context to expose tracking functions
type AnalyticsContextType = {
  trackEvent: (
    category: EventCategory,
    action: EventAction,
    detail: string,
    props?: Record<string, unknown>,
  ) => void;
};

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(
  undefined,
);

// Provider component that wraps our app
export function AnalyticsProvider({
  children,
  appKey,
}: {
  children: ReactNode;
  appKey?: string;
}) {
  // If we want to replace Aptabase in the future, we'd modify this component
  return (
    <AptabaseProvider appKey={appKey} options={{ appVersion: "0.1.13" }}>
      <AnalyticsConsumer>{children}</AnalyticsConsumer>
    </AptabaseProvider>
  );
}

// Consumer component that provides the analytics functions
function AnalyticsConsumer({ children }: { children: ReactNode }) {
  // Currently using Aptabase, but this could be replaced
  const aptabase = useAptabase();

  // Create our wrapper functions
  const analytics: AnalyticsContextType = {
    trackEvent: (category, action, detail, props) => {
      const eventName = `${category}.${action}.${detail}`;
      aptabase.trackEvent(eventName, props);
    },
  };

  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  );
}

// Hook to use analytics in components
export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  return context;
}

// Component to track page views
export function PageViewTracker({ path }: { path: string }) {
  const { trackEvent } = useAnalytics();

  React.useEffect(() => {
    trackEvent("ui", "view", "page", { path });
  }, [path, trackEvent]);

  return null;
}
