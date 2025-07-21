import { useMemo } from "react";

export function useOpenPath() {
  const openPath = useMemo(() => {
    if (
      typeof window !== "undefined" &&
      typeof window.__TAURI__ !== "undefined"
    ) {
      return window.__TAURI__.opener.openPath;
    }
    return (path: string) => window.open(path, "_blank");
  }, []);

  return { openPath };
}
