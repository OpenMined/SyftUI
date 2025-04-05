// Mock data for dashboard widgets and layout
export type WidgetType =
  | "api-requests"
  | "api-broadcast"
  | "queue-rpc"
  | "projects-rds"
  | "system-load";

export interface WidgetDefinition {
  id: string;
  type: WidgetType;
  title: string;
  subtitle?: string;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
}

export interface Layout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export interface DashboardLayout {
  layouts: {
    lg: Layout[];
    md: Layout[];
    sm: Layout[];
    xs: Layout[];
  };
  widgets: WidgetDefinition[];
}

// Widget templates available for adding to dashboard
export const availableWidgets: WidgetDefinition[] = [
  {
    id: "api-requests",
    type: "api-requests",
    title: "API requests • Inbox",
    width: 2,
    height: 2,
    minWidth: 1,
    minHeight: 1,
  },
  {
    id: "api-broadcast",
    type: "api-broadcast",
    title: "API broadcast • Inbox",
    width: 2,
    height: 2,
    minWidth: 1,
    minHeight: 1,
  },
  {
    id: "queue-rpc",
    type: "queue-rpc",
    title: "Queue • RPC",
    width: 2,
    height: 2,
    minWidth: 1,
    minHeight: 1,
  },
  {
    id: "projects-rds",
    type: "projects-rds",
    title: "Projects • RDS",
    width: 2,
    height: 2,
    minWidth: 1,
    minHeight: 1,
  },
  {
    id: "system-load",
    type: "system-load",
    title: "System load (1 hour) • ftop",
    width: 2,
    height: 2,
    minWidth: 1,
    minHeight: 1,
  },
];

// Default dashboard layout
export const defaultDashboardLayout: DashboardLayout = {
  layouts: {
    lg: [
      { i: "widget-1", x: 3, y: 0, w: 1, h: 3, minW: 1, minH: 1 },
      { i: "widget-2", x: 1, y: 3, w: 1, h: 2, minW: 1, minH: 1 },
      { i: "widget-3", x: 0, y: 3, w: 1, h: 2, minW: 1, minH: 1 },
      { i: "widget-4", x: 0, y: 0, w: 3, h: 3, minW: 1, minH: 1 },
      { i: "widget-5", x: 2, y: 3, w: 2, h: 2, minW: 1, minH: 1 },
    ],
    md: [
      { i: "widget-1", x: 3, y: 0, w: 1, h: 3, minW: 1, minH: 1 },
      { i: "widget-2", x: 1, y: 3, w: 1, h: 2, minW: 1, minH: 1 },
      { i: "widget-3", x: 0, y: 3, w: 1, h: 2, minW: 1, minH: 1 },
      { i: "widget-4", x: 0, y: 0, w: 3, h: 3, minW: 1, minH: 1 },
      { i: "widget-5", x: 2, y: 3, w: 2, h: 2, minW: 1, minH: 1 },
    ],
    sm: [
      { i: "widget-1", x: 0, y: 0, w: 2, h: 2, minW: 1, minH: 1 },
      { i: "widget-2", x: 0, y: 2, w: 2, h: 2, minW: 1, minH: 1 },
      { i: "widget-3", x: 0, y: 4, w: 2, h: 2, minW: 1, minH: 1 },
      { i: "widget-4", x: 0, y: 6, w: 2, h: 2, minW: 1, minH: 1 },
      { i: "widget-5", x: 0, y: 8, w: 2, h: 2, minW: 1, minH: 1 },
    ],
    xs: [
      { i: "widget-1", x: 0, y: 0, w: 1, h: 2, minW: 1, minH: 1 },
      { i: "widget-2", x: 0, y: 2, w: 1, h: 2, minW: 1, minH: 1 },
      { i: "widget-3", x: 0, y: 4, w: 1, h: 2, minW: 1, minH: 1 },
      { i: "widget-4", x: 0, y: 6, w: 1, h: 2, minW: 1, minH: 1 },
      { i: "widget-5", x: 0, y: 8, w: 1, h: 2, minW: 1, minH: 1 },
    ],
  },
  widgets: [
    {
      id: "widget-1",
      type: "api-requests",
      title: "API requests • Inbox",
      width: 2,
      height: 2,
    },
    {
      id: "widget-2",
      type: "queue-rpc",
      title: "Queue • RPC",
      width: 2,
      height: 2,
    },
    {
      id: "widget-3",
      type: "projects-rds",
      title: "Projects • RDS",
      width: 2,
      height: 2,
    },
    {
      id: "widget-4",
      type: "system-load",
      title: "System load (1 hour) • ftop",
      width: 2,
      height: 2,
    },
    {
      id: "widget-5",
      type: "api-broadcast",
      title: "API broadcast • Inbox",
      width: 2,
      height: 2,
    },
  ],
};

// Mock function to save dashboard layout to backend
export const saveDashboardLayout = async (
  layout: DashboardLayout,
): Promise<boolean> => {
  console.log("Saving dashboard layout to backend:", layout);
  // Mock delay to simulate API call
  // await new Promise(resolve => setTimeout(resolve, 500));
  return true;
};

// Mock function to load dashboard layout from backend
export const loadDashboardLayout = async (): Promise<DashboardLayout> => {
  console.log("Loading dashboard layout from backend");
  // Mock delay to simulate API call
  // await new Promise(resolve => setTimeout(resolve, 500));
  return defaultDashboardLayout;
};
