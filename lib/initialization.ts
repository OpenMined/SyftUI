// lib/initialization.ts
const INITIALIZATION_KEY = 'syftui_initialized';

/**
 * Initialization service for SyftUI application
 * Runs initialization tasks only once per app installation/clear storage
 */
export const initializationService = {
  /**
   * Check if app has been initialized
   */
  isInitialized(): boolean {
    if (typeof window === 'undefined') return false; // Server-side check
    return localStorage.getItem(INITIALIZATION_KEY) === 'true';
  },

  /**
   * Mark app as initialized
   */
  markAsInitialized(): void {
    if (typeof window === 'undefined') return; // Server-side check
    localStorage.setItem(INITIALIZATION_KEY, 'true');
  },

  /**
   * Reset initialization status (for testing or clearing app data)
   */
  reset(): void {
    if (typeof window === 'undefined') return; // Server-side check
    localStorage.removeItem(INITIALIZATION_KEY);
  },

  /**
   * Run initialization tasks and mark as initialized
   */
  async initialize(): Promise<void> {
    if (this.isInitialized()) return;

    try {
      // Run initialization tasks
      await this.setupSidebarFavorites();
      // Add more initialization tasks as needed

      // Mark as initialized only after all tasks complete successfully
      this.markAsInitialized();
      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Initialization failed:', error);
      // Optionally: you can choose not to mark as initialized if it fails
      // so it will try again on next load
    }
  },

  /**
   * Setup sidebar favorite items
   */
  async setupSidebarFavorites(): Promise<void> {
    if (typeof window === 'undefined') return;
    const favorites = [
      { "id": "dir-datasites", "name": "Datasites", "path": ["datasites"] },
      { "id": "folder-9", "name": "My datasite", "path": ["datasites", "user@example.com"] }
    ];
    localStorage.setItem('syftui-favorites', JSON.stringify(favorites));
  }
};
