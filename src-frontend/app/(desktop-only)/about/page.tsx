"use client";

import { Icon } from "@/components/logo/icon";
import useHashParams from "@/hooks/use-hash-params";
import { timeAgo } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useEffect } from "react";

export default function MacbookInfo() {
  const { theme } = useTheme();
  const {
    desktop_version,
    desktop_hash,
    desktop_build,
    daemon_version,
    daemon_hash,
    daemon_build,
  } = useHashParams();
  const { openPath } =
    typeof window !== "undefined" && typeof window.__TAURI__ !== "undefined"
      ? window.__TAURI__.opener
      : { openPath: (path: string) => window.open(path, "_blank") };

  useEffect(() => {
    if (window.__TAURI__) {
      window.__TAURI__.core.invoke("update_about_window_titlebar_color", {
        r: theme === "dark" ? 23 : 250,
        g: theme === "dark" ? 23 : 250,
        b: theme === "dark" ? 23 : 250,
      });
    }
  }, [theme]);

  return (
    <div
      data-tauri-drag-region
      className={`bg-primary-foreground relative max-h-[480px] min-h-screen max-w-[280px] min-w-screen overflow-hidden`}
    >
      {/* Content container */}
      <div
        data-tauri-drag-region
        className="flex flex-col items-center px-4 text-center text-white"
      >
        {/* MacBook Image */}
        <div className="relative mt-10 mb-7 flex justify-center">
          <div className="relative h-[128px] w-[256px]">
            <Icon width={256} height={128} />
          </div>
          {/* Add a transparent overlay to the icon and make it draggable */}
          <div
            data-tauri-drag-region
            className="absolute inset-0 bg-transparent"
          ></div>
        </div>

        {/* MacBook Info */}
        <h1 className="text-primary/95 mb-0 text-2xl/tight font-bold tracking-tight">
          SyftBox
        </h1>
        <p className="text-muted-foreground/95 mb-6 text-xs">
          The internet of private data
        </p>

        <div className="mb-3 grid grid-cols-2 gap-y-0.5 text-left text-xs">
          <div className="text-primary/95 pr-2 text-right">Desktop</div>
          <div className="text-muted-foreground/95">v{desktop_version}</div>

          <div className="text-primary/95 pr-2 text-right"></div>
          <div className="text-muted-foreground/95">{desktop_hash}</div>

          <div className="text-primary/95 pr-2 text-right"></div>
          <div className="text-muted-foreground/95">
            {timeAgo(desktop_build)}
          </div>

          <div className="text-primary/95 pr-2 text-right">Daemon</div>
          <div className="text-muted-foreground/95">v{daemon_version}</div>

          <div className="text-primary/95 pr-2 text-right"></div>
          <div className="text-muted-foreground/95">{daemon_hash}</div>

          <div className="text-primary/95 pr-2 text-right"></div>
          <div className="text-muted-foreground/95">
            {timeAgo(daemon_build)}
          </div>
        </div>

        {/* More Info Button */}
        <button
          className="bg-accent text-primary/80 hover:bg-accent-foreground/60 mb-4 cursor-pointer rounded-md px-4 py-1 text-xs"
          onClick={async () => await openPath("https://syftbox.openmined.org")}
        >
          More Info...
        </button>

        {/* Footer */}
        <div className="text-[10px] text-zinc-400">
          <p className="mb-1">
            <span
              className="cursor-pointer hover:underline"
              onClick={async () =>
                await openPath(
                  "https://raw.githubusercontent.com/OpenMined/syft/refs/heads/main/LICENSE",
                )
              }
            >
              License Information
            </span>{" "}
            |{" "}
            <span
              className="cursor-pointer hover:underline"
              onClick={async () =>
                await openPath("https://openmined.org/privacy-policy/")
              }
            >
              Privacy Policy
            </span>
          </p>
          <p>&copy; {new Date().getFullYear()} OpenMined Foundation</p>
          <p>A 501(c)(3) non-profit foundation</p>
        </div>
      </div>
    </div>
  );
}
