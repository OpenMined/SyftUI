"use client"

import { useCallback } from 'react';
import { useFileSystem } from '@/components/file-system-context';

/**
 * Hook for navigating to paths in the file manager from React components
 * 
 * @returns An object with navigation utilities
 */
export function useFileNavigation() {
    const { navigateTo, currentPath, goBack, goForward, canGoBack, canGoForward } = useFileSystem();

    /**
     * Navigate to a specific path in the file manager
     * @param path An array of path segments or string path (e.g. ['documents', 'projects'] or 'documents/projects')
     */
    const navigateToPath = useCallback(
        (path: string[] | string) => {
            // Convert string path to array if needed
            const pathArray = typeof path === 'string'
                ? path.split('/').filter(segment => segment.trim() !== '')
                : path;

            // Navigate to the path
            navigateTo(pathArray);
        },
        [navigateTo]
    );

    /**
     * Navigate to a parent folder
     * @param levels Number of levels to go up (default: 1)
     */
    const navigateUp = useCallback(
        (levels = 1) => {
            if (currentPath.length > 0) {
                const newPath = [...currentPath];
                newPath.splice(-Math.min(levels, newPath.length));
                navigateTo(newPath);
            }
        },
        [currentPath, navigateTo]
    );

    /**
     * Navigate to the Workspace directory
     */
    const navigateToRoot = useCallback(() => {
        navigateTo([]);
    }, [navigateTo]);

    /**
     * Add a new path segment to the current path
     * @param segment The folder name to navigate into
     */
    const navigateInto = useCallback(
        (segment: string) => {
            navigateTo([...currentPath, segment]);
        },
        [currentPath, navigateTo]
    );

    return {
        navigateToPath,
        navigateUp,
        navigateToRoot,
        navigateInto,
        goBack,
        goForward,
        canGoBack,
        canGoForward,
        currentPath
    };
}