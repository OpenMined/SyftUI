import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

export default function TitleBar({ className }: { className?: string }) {
  const titleBarRef = useRef<HTMLDivElement>(null);
  const { platform } = window.__TAURI__.os;

  useEffect(() => {
    // Remove any element with data-tauri-decorum-tb attribute from the DOM, except this component
    const elements = document.querySelectorAll("[data-tauri-decorum-tb]");
    elements.forEach((element) => {
      if (element !== titleBarRef.current) {
        element.remove();
      }
    });
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
      <SidebarTrigger className={platform() === "macos" ? "ml-20" : "ml-2"} />
      <div data-tauri-drag-region="" className="h-full flex-1 bg-transparent" />
    </div>
  );
}
