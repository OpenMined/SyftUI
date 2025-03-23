/**
 * Utility functions for managing favorites
 */

interface FavoriteItem {
  id: string;
  name: string;
  type: string;
  path: string[];
}

const FAVORITES_STORAGE_KEY = 'syftui-favorites';

/**
 * Load favorites from localStorage
 */
export function loadFavorites(): FavoriteItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return storedFavorites ? JSON.parse(storedFavorites) : [];
  } catch (error) {
    console.error('Failed to load favorites from localStorage', error);
    return [];
  }
}

/**
 * Save favorites to localStorage
 */
export function saveFavorites(favorites: FavoriteItem[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error('Failed to save favorites to localStorage', error);
  }
}

/**
 * Add an item to favorites by dispatching a custom event
 * @param item The item to add to favorites (must be a folder)
 */
export function addToFavorites(item: { id: string; name: string; type: string; path: string[] }) {
  if (item.type !== 'folder') {
    console.warn('Only folders can be added to favorites');
    return;
  }
  
  // Create and dispatch the custom event
  const event = new CustomEvent('add-to-favorites', {
    detail: {
      id: item.id,
      name: item.name,
      path: [...item.path, item.name],
    },
  });
  
  window.dispatchEvent(event);
}
