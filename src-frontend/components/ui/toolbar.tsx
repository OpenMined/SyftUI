"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { Input } from "@/components/ui/input";
import { ReactNode } from "react";
import { useSidebarStore } from "@/stores";

interface ToolbarProps {
  title?: string | ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  onToggleSidebar?: () => void;
  leftSection?: ReactNode;
  rightSection?: ReactNode;
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
  searchInput?: boolean;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}

export function Toolbar({
  title,
  icon,
  children,
  className,
  onToggleSidebar,
  leftSection,
  rightSection,
  sidebarOpen: propSidebarOpen,
  setSidebarOpen: propSetSidebarOpen,
  searchInput,
  onSearch,
  searchPlaceholder = "Search...",
}: ToolbarProps) {
  // Use the sidebar context if available, otherwise use props
  const sidebarContext = useSidebarStore();

  // Use the props or context values, with props taking precedence if provided
  const sidebarOpen =
    propSidebarOpen !== undefined
      ? propSidebarOpen
      : sidebarContext.sidebarOpen;
  const setSidebarOpen = propSetSidebarOpen || sidebarContext.setSidebarOpen;

  // Hamburger menu click handler
  const handleSidebarToggle = () => {
    // First try context toggle, then props
    if (sidebarContext && sidebarContext.toggleSidebar) {
      sidebarContext.toggleSidebar();
    } else if (setSidebarOpen) {
      setSidebarOpen(!sidebarOpen);
    } else if (onToggleSidebar) {
      onToggleSidebar();
    }
  };

  return (
    <div
      className={cn(
        "border-border flex items-center justify-between gap-2 border-b p-2 sm:px-4 sm:py-2",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
        {/* Mobile sidebar toggle - only visible on mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={handleSidebarToggle}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {icon && <span>{icon}</span>}
        {title && <h1 className="text-xl font-medium">{title}</h1>}

        {/* Custom left section */}
        {leftSection}
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {/* Search input if requested */}
        {searchInput && (
          <div className="relative hidden sm:block">
            <Input
              type="search"
              placeholder={searchPlaceholder}
              className="w-40 md:w-64"
              onChange={(e) => onSearch && onSearch(e.target.value)}
            />
          </div>
        )}

        {/* Main toolbar content */}
        {children}

        {/* Custom right section */}
        {rightSection}

        {/* Standard elements */}
        <NotificationBell />
        <ThemeToggle />
      </div>
    </div>
  );
}
