import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns a path with the basePath prefix for static assets
 * @param path - The asset path to prefix
 * @returns The path with basePath prefix
 */
export function getAssetPath(path: string): string {
  // Get basePath from environment variable set in next.config.mjs
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${basePath}${normalizedPath}`
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

/**
 * Navigates to a specified path in the file manager
 * @param path An array of path segments or a string path (e.g. ['documents', 'projects'] or 'documents/projects')
 * @param fileSystemDispatch Optional custom dispatch function (useful for testing or custom implementations)
 * @returns A promise that resolves when navigation is complete
 */
export function navigateToPath(
  path: string[] | string,
  fileSystemDispatch?: (action: { type: string; payload: string[] }) => void
): Promise<void> {
  return new Promise((resolve) => {
    // Convert string path to array if needed
    const pathArray = typeof path === 'string'
      ? path.split('/').filter(segment => segment.trim() !== '')
      : path;

    // Get the FileSystemContext from the window object
    // This approach allows using the function outside React components
    const eventDetail = {
      path: pathArray,
      callback: resolve
    };

    // Use a custom event to communicate with the FileSystemProvider
    const event = new CustomEvent('navigate-to-path', { detail: eventDetail });
    window.dispatchEvent(event);

    // If a custom dispatch is provided (for testing), use it directly
    if (fileSystemDispatch) {
      fileSystemDispatch({ type: 'NAVIGATE_TO', payload: pathArray });
      resolve();
    }
  });
}

