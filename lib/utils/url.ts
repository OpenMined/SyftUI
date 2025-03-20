/**
 * Triggers navigation to a path both in URL and file system context
 * @param path Array of path segments
 */
export function navigateToPath(path: string[]): void {
  // Update the URL
  updateUrlWithPath(path);
  
  // Dispatch a custom event that file-system-context will listen for
  if (typeof window !== 'undefined') {
    const navigateEvent = new CustomEvent('navigate-to-path', {
      detail: { path }
    });
    window.dispatchEvent(navigateEvent);
  }
}

/**
 * Find a file in the file system by its name and parent path
 * @param fileSystem The file system array
 * @param dirPath Parent directory path
 * @param fileName Name of the file to find
 * @returns The file system item if found, or null
 */
export function findFileInPath(fileSystem: any[], dirPath: string[], fileName: string): any | null {
  // Navigate to the directory
  let current = fileSystem;
  
  for (const segment of dirPath) {
    const folder = current.find((item: any) => item.type === 'folder' && item.name === segment);
    if (folder && folder.children) {
      current = folder.children;
    } else {
      return null; // Directory path doesn't exist
    }
  }
  
  // Look for the file in the current directory
  return current.find((item: any) => item.type === 'file' && item.name === fileName) || null;
}

/**
 * Updates the URL with the current path
 * @param path Array of path segments
 */
export function updateUrlWithPath(path: string[]): void {
  if (typeof window === 'undefined') return;
  
  const url = new URL(window.location.href);
  if (path.length > 0) {
    // Join path segments with slashes
    url.searchParams.set('path', path.join('/'));
  } else {
    // Remove path parameter if we're at the root
    url.searchParams.delete('path');
  }
  
  // Update the URL without refreshing the page
  window.history.pushState({}, '', url.toString());
}

/**
 * Gets the path segments from the URL
 * @returns Array of path segments or empty array if no path parameter
 */
export function getPathFromUrl(): string[] {
  if (typeof window === 'undefined') return [];
  
  const url = new URL(window.location.href);
  const pathParam = url.searchParams.get('path');
  
  if (pathParam) {
    // Split path by slashes and filter out empty segments
    return pathParam.split('/').filter(segment => segment.length > 0);
  }
  
  return [];
}

/**
 * Process a path to separate directory path and file
 * @param path The full path from URL
 * @param fileSystem The file system structure to check against
 * @returns Object with dirPath and fileName
 */
export function processPath(path: string[], fileSystem?: any[]): { dirPath: string[], fileName: string | null } {
  if (path.length === 0) {
    return { dirPath: [], fileName: null };
  }
  
  // If we don't have the file system structure, we can't reliably check
  // Just return the path as directory path
  if (!fileSystem) {
    return { dirPath: path, fileName: null };
  }
  
  // Check if the last segment is a file by traversing the file system
  let current = fileSystem;
  let isLastSegmentFile = false;
  let i = 0;
  
  // Navigate through the path segments
  while (i < path.length - 1 && current) {
    const segment = path[i];
    const folder = current.find((item: any) => item.type === 'folder' && item.name === segment);
    
    if (folder && folder.children) {
      current = folder.children;
      i++;
    } else {
      // Can't navigate further, return what we've got so far
      return {
        dirPath: path.slice(0, i),
        fileName: null
      };
    }
  }
  
  // Now we've navigated to the last directory, check if the last segment is a file
  if (current && i < path.length) {
    const lastSegment = path[i];
    const item = current.find((item: any) => item.name === lastSegment);
    
    if (item && item.type === 'file') {
      isLastSegmentFile = true;
    }
  }
  
  if (isLastSegmentFile) {
    return {
      dirPath: path.slice(0, -1),
      fileName: path[path.length - 1]
    };
  }
  
  return {
    dirPath: path,
    fileName: null
  };
}
