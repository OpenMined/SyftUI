// lib/initialization.ts
import { useConnectionStore, useSidebarStore } from "@/stores";

const FIRST_RUN_DONE_KEY = "syftui_first_run_done_20250519";

/**
 * Initialization service for SyftUI application
 * Runs initialization tasks only once per app session
 */
export const initializationService = {
  /**
   * Check if first run has been completed
   */
  isFirstRunDone(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(FIRST_RUN_DONE_KEY) === "true";
  },

  /**
   * Mark first run as completed
   */
  markAsFirstRunDone(): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(FIRST_RUN_DONE_KEY, "true");
  },

  /**
   * Reset first run status (for testing or clearing app data)
   */
  reset_first_run(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(FIRST_RUN_DONE_KEY);
  },

  /**
   * Run initialization tasks and mark as initialized
   */
  async initialize(): Promise<void> {
    const isFirstRun = !this.isFirstRunDone();

    try {
      // First-time initialization tasks
      if (isFirstRun) {
        // Run initialization tasks
        await this.setupSidebarFavorites();

        // Add more initialization tasks as needed
        // ...

        // Mark as initialized only after all tasks complete successfully
        this.markAsFirstRunDone();
        console.log("First run completed successfully");
      }
    } catch (error) {
      console.error("First run initialization failed:", error);
      // Do nothing and let it try again on next load
    }
  },

  /**
   * Setup sidebar favorite items
   */
  async setupSidebarFavorites(): Promise<void> {
    if (typeof window === "undefined") return;
    const { datasite } = useConnectionStore.getState();
    const { setFavorites } = useSidebarStore.getState();

    const favorites = [
      { id: "dir-datasites", name: "Datasites", path: ["datasites"] },
    ];
    if (datasite?.email) {
      favorites.push({
        id: "dir-my-datasite",
        name: "My datasite",
        path: ["datasites", datasite?.email],
      });
    }
    setFavorites(favorites);
  },
};
