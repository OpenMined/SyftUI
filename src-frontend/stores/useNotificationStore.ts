"use client";

import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: Date;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: () => number;
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "read">,
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [
    // {
    //   id: "1",
    //   title: "Welcome to SyftBox",
    //   message: "Your files are now syncing",
    //   type: "info",
    //   timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    //   read: false,
    // },
    // {
    //   id: "2",
    //   title: "Sync Complete",
    //   message: "All files have been synced successfully",
    //   type: "success",
    //   timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    //   read: true,
    // },
    // {
    //   id: "3",
    //   title: "Sync Error",
    //   message: "Failed to sync 'Project Proposal.pdf'",
    //   type: "error",
    //   timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    //   read: false,
    // },
  ],

  unreadCount: () => {
    return get().notifications.filter((notification) => !notification.read)
      .length;
  },

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: uuidv4(),
      timestamp: new Date(),
      read: false,
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications],
    }));
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id == id ? { ...notification, read: true } : notification,
      ),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((notification) => ({
        ...notification,
        read: true,
      })),
    }));
  },

  clearNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(
        (notification) => notification.id !== id,
      ),
    }));
  },

  clearAllNotifications: () => {
    set({ notifications: [] });
  },
}));
