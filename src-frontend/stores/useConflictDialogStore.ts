import { create } from "zustand";
import type { FileSystemItem } from "@/lib/types";

interface ConflictItem {
  operation: "move" | "copy";
  sourceItem: FileSystemItem;
  existingItem: FileSystemItem;
}

interface ConflictResponse {
  conflict: ConflictItem;
  resolution: "replace" | "rename" | "skip";
}

interface ConflictDialogState {
  // State
  conflicts: ConflictItem[];
  isOpen: boolean;
  resolvePromise: ((responses: ConflictResponse[]) => void) | null;
  currentIndex: number;
  responses: ConflictResponse[];

  // Actions
  showConflicts: (conflicts: ConflictItem[]) => Promise<ConflictResponse[]>;
  resolveConflicts: (responses: ConflictResponse[]) => void;
  closeDialog: () => void;
  handleResolution: (
    resolution: "replace" | "rename" | "skip",
    applyToAll?: boolean,
  ) => void;
}

export const useConflictDialogStore = create<ConflictDialogState>(
  (set, get) => ({
    // Initial state
    conflicts: [],
    isOpen: false,
    resolvePromise: null,
    currentIndex: 0,
    responses: [],

    // Actions
    showConflicts: (conflicts) => {
      return new Promise((resolve) => {
        set({
          conflicts,
          isOpen: true,
          resolvePromise: resolve,
          currentIndex: 0,
          responses: [],
        });
      });
    },

    resolveConflicts: (responses) => {
      const { resolvePromise } = get();
      if (resolvePromise) {
        resolvePromise(responses);
        set({
          conflicts: [],
          isOpen: false,
          resolvePromise: null,
          currentIndex: 0,
          responses: [],
        });
      }
    },

    closeDialog: () => {
      const { resolvePromise } = get();
      if (resolvePromise) {
        // If dialog is closed without resolution, skip all conflicts
        const responses = get().conflicts.map((conflict) => ({
          conflict,
          resolution: "skip" as const,
        }));
        resolvePromise(responses);
        set({
          conflicts: [],
          isOpen: false,
          resolvePromise: null,
          currentIndex: 0,
          responses: [],
        });
      }
    },

    handleResolution: (resolution, applyToAll = false) => {
      const { conflicts, currentIndex, responses } = get();
      const currentConflict = conflicts[currentIndex];

      if (!currentConflict) return;

      const newResponses = [
        ...responses,
        { conflict: currentConflict, resolution },
      ];

      if (applyToAll) {
        // Apply the same resolution to all remaining conflicts
        const remainingResponses = conflicts
          .slice(currentIndex + 1)
          .map((conflict) => ({ conflict, resolution }));
        get().resolveConflicts([...newResponses, ...remainingResponses]);
      } else if (currentIndex < conflicts.length - 1) {
        // Move to next conflict
        set({
          currentIndex: currentIndex + 1,
          responses: newResponses,
        });
      } else {
        // All conflicts resolved
        get().resolveConflicts(newResponses);
      }
    },
  }),
);
