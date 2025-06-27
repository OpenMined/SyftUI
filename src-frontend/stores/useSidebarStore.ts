"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface FavoriteItem {
  id: string;
  name: string;
  type: "folder" | "app";
  path?: string[]; // Optional for apps
}

interface SidebarState {
  // Favorites state
  favorites: FavoriteItem[];

  // Collapsible sections state
  openSections: { [key: string]: boolean };

  // Active navigation item
  activeItem: string;

  // Actions
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (id: string) => void;
  setFavorites: (favorites: FavoriteItem[]) => void;
  toggleSection: (section: string) => void;
  setActiveItem: (item: string) => void;
  clearFavorites: () => void;
}

const SIDEBAR_STORAGE_KEY = "syftui-sidebar-20250628";

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      // Initial state
      favorites: [],
      openSections: {
        favorites: true,
      },
      activeItem: "",

      // Actions
      addFavorite: (item) => {
        const { favorites } = get();
        // Check if already in favorites
        if (!favorites.some((fav) => fav.id === item.id)) {
          set((state) => ({
            favorites: [...state.favorites, item],
          }));
        }
      },

      removeFavorite: (id) => {
        set((state) => ({
          favorites: state.favorites.filter((fav) => fav.id !== id),
        }));
      },

      setFavorites: (favorites) => {
        set({ favorites });
      },

      toggleSection: (section) => {
        set((state) => ({
          openSections: {
            ...state.openSections,
            [section]: !state.openSections[section],
          },
        }));
      },

      setActiveItem: (item) => {
        set({ activeItem: item });
      },

      clearFavorites: () => {
        set({ favorites: [] });
      },
    }),
    {
      name: SIDEBAR_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        favorites: state.favorites,
        openSections: state.openSections,
      }),
    },
  ),
);
