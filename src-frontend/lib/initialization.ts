// lib/initialization.ts
const FIRST_RUN_DONE_KEY = "syftui_first_run_done";

/**
 * Initialization service for SyftUI application
 * Runs initialization tasks only once per app installation/clear storage
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
    const favorites = [
      { id: "dir-datasites", name: "Datasites", path: ["datasites"] },
      // TODO: enable this once we have a way to get user's email
      // {
      //   id: "folder-9",
      //   name: "My datasite",
      //   path: ["datasites", "user@example.com"],
      // },
    ];
    localStorage.setItem("syftui-favorites", JSON.stringify(favorites));
  },
};
