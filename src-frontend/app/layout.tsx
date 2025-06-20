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
import { AppBreadcrumb } from "@/components/apps/breadcrumb";
import { WorkspaceBreadcrumb } from "@/components/workspace/breadcrumb";
import { ScrollText } from "lucide-react";

const title = "SyftBox";
const description = "The internet of private data!";

function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const sidebarExcludedPaths = ["/", "/about/", "/updates/"];
  const shouldShowSidebar = !sidebarExcludedPaths.includes(pathname);
  const { theme } = useTheme();

  useEffect(() => {
    if (typeof window !== "undefined" && window.__TAURI__) {
      window.__TAURI__.core.invoke("update_theme", {
        isDark: theme === "dark",
      });
    }
  }, [theme]);

  // Determine which breadcrumb to show based on the current route
  const getBreadcrumb = () => {
    if (pathname.startsWith("/apps")) {
      return <AppBreadcrumb />;
    }
    if (pathname.startsWith("/workspace")) {
      return <WorkspaceBreadcrumb />;
    }
    if (pathname.startsWith("/logs")) {
      return (
        <span className="flex items-center gap-2 p-1 text-sm">
          <ScrollText className="h-4 w-4" />
          <span>Logs</span>
        </span>
      );
    }
    // For other routes, show nothing
    return null;
  };

  return (
    <NuqsAdapter>
      <SidebarProvider
        defaultOpen={
          typeof window !== "undefined" ? window.innerWidth >= 768 : false
        }
        style={{
          "--sidebar-width": "15rem",
        }}
      >
        <div className="bg-sidebar flex h-screen w-screen flex-col">
          <TitleBar>{getBreadcrumb()}</TitleBar>
          <div className="flex flex-1 overflow-hidden">
            {shouldShowSidebar && (
              <Sidebar className="border-none">
                <AppSidebar />
              </Sidebar>
            )}
            <SidebarInset className="mx-2 mb-2 min-h-min flex-1 rounded-md border">
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
            <MainLayout>{children}</MainLayout>
          </ThemeProvider>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
