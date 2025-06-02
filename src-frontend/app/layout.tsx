"use client";

import "./globals.css";
import type React from "react";
import { usePathname } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useSidebarStore } from "@/stores";
import { Sidebar } from "@/components/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AnalyticsProvider, PageViewTracker } from "@/lib/analytics";
import { useEffect } from "react";
import { useTheme } from "next-themes";

const title = "SyftBox";
const description = "The internet of private data!";

function MainLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen } = useSidebarStore();
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

  return (
    <NuqsAdapter>
      <div className="flex h-screen">
        {shouldShowSidebar && (
          <div
            className={`fixed inset-0 z-40 transition-transform duration-300 ease-in-out md:relative md:z-0 ${
              sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full md:translate-x-0"
            } shrink-0 md:w-64`}
          >
            <Sidebar closeSidebar={() => setSidebarOpen(false)} />
          </div>
        )}
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
      <Toaster />
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
