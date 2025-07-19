import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";

export default function TitleBar({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const titleBarRef = useRef<HTMLDivElement>(null);
  const [platform, setPlatform] = useState<string>("macos");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    // Remove any element with data-tauri-decorum-tb attribute from the DOM, except this component
    const elements = document.querySelectorAll("[data-tauri-decorum-tb]");
    elements.forEach((element) => {
      if (element !== titleBarRef.current) {
        element.remove();
      }
    });
  }, []);

  useEffect(() => {
    const { platform } =
      typeof window !== "undefined" && window.__TAURI__
        ? window.__TAURI__.os
        : { platform: () => "web" };
    setPlatform(platform());
  }, []);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const checkFullscreen = async () => {
      if (typeof window === "undefined" || !window.__TAURI__) {
        return;
      }

      const { listen } = window.__TAURI__!.event;
      unlisten = await listen("tauri://resize", async () => {
        const fullscreen = await window
          .__TAURI__!.window.getCurrentWindow()
          .isFullscreen();
        setIsFullscreen(fullscreen);
      });
    };

    checkFullscreen();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  return (
    <div
      ref={titleBarRef}
      data-tauri-decorum-tb=""
      className={cn(
        "top-0 left-0 z-100 flex h-10 w-full items-center justify-between px-2",
        className,
      )}
    >
      <div
        data-tauri-drag-region=""
        className="flex h-full flex-1 items-center justify-between bg-transparent"
      >
        <div
          className={cn(
            "relative flex items-center gap-1",
            platform === "macos" && !isFullscreen ? "left-20" : "ml-2",
          )}
        >
          <SidebarTrigger />
          <div className="flex items-center gap-1">
            {/* <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => window.history.back()}
              aria-label="Go back"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => window.history.forward()}
              aria-label="Go forward"
            >
              <ChevronRight className="h-4 w-4" />
            </Button> */}
          </div>
        </div>
        <div className="absolute left-1/2 flex -translate-x-1/2 transform items-center justify-center">
          {children}
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
