export interface DeepLinkRoute {
  type: "datasite" | "workspace" | "apps";
  email?: string;
  path?: string;
  action?: string;
  params?: Record<string, string>;
}

export function parseDeepLink(url: string): DeepLinkRoute | null {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== "syft:") {
      return null;
    }

    const host = parsedUrl.hostname;
    const username = parsedUrl.username;
    const pathname = parsedUrl.pathname;
    const searchParams = Object.fromEntries(parsedUrl.searchParams.entries());

    // Check if this is an email-based URL (username@hostname format)
    if (username && host) {
      const email = `${username}@${host}`;
      return {
        type: "datasite",
        email: email,
        path: pathname.startsWith("/") ? pathname.slice(1) : pathname,
        params: searchParams,
      };
    }

    // Fallback: Check if host contains @ (for cases where email is in hostname)
    if (host.includes("@")) {
      return {
        type: "datasite",
        email: host,
        path: pathname.startsWith("/") ? pathname.slice(1) : pathname,
        params: searchParams,
      };
    }

    // Handle workspace paths
    if (host === "workspace") {
      return {
        type: "workspace",
        path: pathname.startsWith("/") ? pathname.slice(1) : pathname,
        params: searchParams,
      };
    }

    // Handle apps commands
    if (host === "apps") {
      const pathParts = pathname.split("/").filter(Boolean);
      const action = pathParts[0];

      if (action === "install") {
        return {
          type: "apps",
          action: "install",
          params: searchParams,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Failed to parse deep link:", error);
    return null;
  }
}

export function validateDeepLink(url: string): boolean {
  return parseDeepLink(url) !== null;
}

export function isEmailHost(host: string): boolean {
  return host.includes("@") && host.includes(".");
}
