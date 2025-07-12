"use client";

import "./globals.css";
import type React from "react";
import TitleBar from "@/components/title-bar";
import { usePathname } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { AnalyticsProvider, PageViewTracker } from "@/lib/analytics";
import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useBreadcrumbStore } from "@/stores";
import { DeepLinkRouter } from "@/components/deep-link-router";

const title = "SyftBox";
const description = "The internet of private data!";

function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const sidebarExcludedPaths = ["/", "/about/", "/updates/"];
  const shouldShowSidebar = !sidebarExcludedPaths.includes(pathname);
  const { theme } = useTheme();
  const { breadcrumbContent } = useBreadcrumbStore();

  useEffect(() => {
    if (typeof window !== "undefined" && window.__TAURI__) {
      window.__TAURI__.core.invoke("update_theme", {
        isDark: theme === "dark",
      });
    }
  }, [theme]);

  // Forward console logs to Tauri logger
  useEffect(() => {
    if (typeof window !== "undefined" && window.__TAURI__) {
      const { warn, debug, trace, info, error } = window.__TAURI__.log;

      function forwardConsole(
        fnName: "log" | "debug" | "info" | "warn" | "error",
        logger: (message: string) => Promise<void>,
      ) {
        const original = console[fnName];
        console[fnName] = (message) => {
          original(message);
          logger(message);
        };
      }

      forwardConsole("log", trace);
      forwardConsole("debug", debug);
      forwardConsole("info", info);
      forwardConsole("warn", warn);
      forwardConsole("error", error);
    }
  }, []);

  if (!shouldShowSidebar) {
    return (
      <div className="bg-sidebar flex h-screen w-screen">
        <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
        <Toaster />
      </div>
    );
  }

  return (
    <NuqsAdapter>
      <SidebarProvider
        defaultOpen={
          typeof window !== "undefined" ? window.innerWidth >= 768 : true
        }
        style={{
          "--sidebar-width": "15rem",
        }}
      >
        <div className="bg-sidebar flex h-screen w-screen flex-col">
          <TitleBar>{breadcrumbContent}</TitleBar>
          <div className="flex flex-1 overflow-hidden">
            <Sidebar className="border-none">
              <AppSidebar />
            </Sidebar>
            <SidebarInset className="mx-2 mb-2 min-h-min flex-1 overflow-hidden rounded-md border">
              {children}
            </SidebarInset>
          </div>
        </div>
        <Toaster />
      </SidebarProvider>
    </NuqsAdapter>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </head>
      <body className="fixed h-screen w-screen overflow-hidden">
        <AnalyticsProvider appKey={process.env.NEXT_PUBLIC_APTABASE_KEY}>
          <PageViewTracker path={pathname} />
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            disableTransitionOnChange
          >
            <DeepLinkRouter />
            <MainLayout>{children}</MainLayout>
          </ThemeProvider>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
