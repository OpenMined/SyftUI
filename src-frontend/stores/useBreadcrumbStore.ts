import { create } from "zustand";
import type { ReactNode } from "react";

interface BreadcrumbStore {
  breadcrumbContent: ReactNode | null;
  setBreadcrumb: (content: ReactNode | null) => void;
  clearBreadcrumb: () => void;
}

export const useBreadcrumbStore = create<BreadcrumbStore>((set) => ({
  breadcrumbContent: null,
  setBreadcrumb: (content) => set({ breadcrumbContent: content }),
  clearBreadcrumb: () => set({ breadcrumbContent: null }),
}));
