"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ReactNode } from "react";
import { useSidebar } from "@/components/ui/sidebar";

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

// Wrapper component to safely use sidebar context
function ToolbarWithSidebar(props: ToolbarProps) {
  const sidebarContext = useSidebar();
  return <ToolbarInternal {...props} sidebarContext={sidebarContext} />;
}

// Internal component that handles both sidebar context and props
function ToolbarInternal({
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
  sidebarContext,
}: ToolbarProps & {
  sidebarContext?: {
    open: boolean;
    setOpen: (open: boolean) => void;
    toggleSidebar: () => void;
  };
}) {
  // Use the props or context values, with props taking precedence if provided
  const sidebarOpen =
    propSidebarOpen !== undefined
      ? propSidebarOpen
      : (sidebarContext?.open ?? false);
  const setSidebarOpen = propSetSidebarOpen || sidebarContext?.setOpen;

  // Hamburger menu click handler
  const handleSidebarToggle = () => {
    // First try shadcn/ui sidebar toggle, then props
    if (sidebarContext?.toggleSidebar) {
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
      </div>
    </div>
  );
}

// Main export that tries to use sidebar context, falls back to props-only version
export function Toolbar(props: ToolbarProps) {
  try {
    return <ToolbarWithSidebar {...props} />;
  } catch {
    // If sidebar context is not available, use props-only version
    return <ToolbarInternal {...props} />;
  }
}
