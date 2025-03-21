// Mock data for dashboard widgets and layout
import { v4 as uuidv4 } from 'uuid';

export type WidgetType = 'api-requests' | 'queue-rpc' | 'projects-rds' | 'system-load';

export interface WidgetDefinition {
  id: string;
  type: WidgetType;
  title: string;
  subtitle?: string;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  content?: string;
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

// Mock API Requests data
const apiRequestsMockData = [
  { id: uuidv4(), title: "Add User Authentication", description: "Implement OAuth2 flow", status: "pending" },
  { id: uuidv4(), title: "Create PDF Export API", description: "Generate reports as PDF", status: "pending" },
  { id: uuidv4(), title: "Fix CORS issues", description: "Update middleware config", status: "pending" },
  { id: uuidv4(), title: "Implement rate limiting", description: "Add Redis-based rate limiting", status: "pending" },
];

// Mock Queue RPC data
const queueRpcMockData = [
  { id: uuidv4(), url: "/api/process/image", uuid: "f8c3de3d-1fea-4d7c-a8b0", timestamp: "2025-03-20T15:30:00Z", status: "success" },
  { id: uuidv4(), url: "/api/analyze/data", uuid: "a1b2c3d4-e5f6-7g8h", timestamp: "2025-03-20T15:45:00Z", status: "pending" },
  { id: uuidv4(), url: "/api/transform/json", uuid: "i9j0k1l2-m3n4-o5p6", timestamp: "2025-03-20T16:00:00Z", status: "failed" },
  { id: uuidv4(), url: "/api/generate/report", uuid: "q7r8s9t0-u1v2-w3x4", timestamp: "2025-03-20T16:15:00Z", status: "pending" },
];

// Mock Projects RDS data
const projectsRdsMockData = [
  { id: uuidv4(), name: "Customer Segmentation", status: "result available" },
  { id: uuidv4(), name: "Sales Forecasting", status: "processing" },
  { id: uuidv4(), name: "Anomaly Detection", status: "awaiting approval" },
  { id: uuidv4(), name: "Text Classification", status: "draft" },
];

// Generate mock system load data
const generateSystemLoadData = () => {
  const data = [];
  const now = new Date();
  
  for (let i = 60; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000);
    data.push({
      time: time.toISOString(),
      cpu: Math.floor(Math.random() * 30) + 10, // Random CPU load between 10-40%
      ram: Math.floor(Math.random() * 40) + 30, // Random RAM usage between 30-70%
    });
  }
  
  return data;
};

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
    content: JSON.stringify(apiRequestsMockData),
  },
  {
    id: "queue-rpc",
    type: "queue-rpc",
    title: "Queue • RPC",
    width: 2,
    height: 2,
    minWidth: 1,
    minHeight: 1,
    content: JSON.stringify(queueRpcMockData),
  },
  {
    id: "projects-rds",
    type: "projects-rds",
    title: "Projects • RDS",
    width: 2,
    height: 2,
    minWidth: 1,
    minHeight: 1,
    content: JSON.stringify(projectsRdsMockData),
  },
  {
    id: "system-load",
    type: "system-load",
    title: "System load (1 hour) • ftop",
    width: 2,
    height: 2,
    minWidth: 1,
    minHeight: 1,
    content: JSON.stringify(generateSystemLoadData()),
  },
];

// Default dashboard layout
export const defaultDashboardLayout: DashboardLayout = {
  layouts: {
    lg: [
      { i: "widget-1", x: 0, y: 0, w: 2, h: 2, minW: 1, minH: 1 },
      { i: "widget-2", x: 2, y: 0, w: 2, h: 2, minW: 1, minH: 1 },
      { i: "widget-3", x: 0, y: 2, w: 2, h: 2, minW: 1, minH: 1 },
      { i: "widget-4", x: 2, y: 2, w: 2, h: 2, minW: 1, minH: 1 },
    ],
    md: [
      { i: "widget-1", x: 0, y: 0, w: 2, h: 2, minW: 1, minH: 1 },
      { i: "widget-2", x: 2, y: 0, w: 2, h: 2, minW: 1, minH: 1 },
      { i: "widget-3", x: 0, y: 2, w: 2, h: 2, minW: 1, minH: 1 },
      { i: "widget-4", x: 2, y: 2, w: 2, h: 2, minW: 1, minH: 1 },
    ],
    sm: [
      { i: "widget-1", x: 0, y: 0, w: 2, h: 2, minW: 1, minH: 1 },
      { i: "widget-2", x: 0, y: 2, w: 2, h: 2, minW: 1, minH: 1 },
      { i: "widget-3", x: 0, y: 4, w: 2, h: 2, minW: 1, minH: 1 },
      { i: "widget-4", x: 0, y: 6, w: 2, h: 2, minW: 1, minH: 1 },
    ],
    xs: [
      { i: "widget-1", x: 0, y: 0, w: 1, h: 2, minW: 1, minH: 1 },
      { i: "widget-2", x: 0, y: 2, w: 1, h: 2, minW: 1, minH: 1 },
      { i: "widget-3", x: 0, y: 4, w: 1, h: 2, minW: 1, minH: 1 },
      { i: "widget-4", x: 0, y: 6, w: 1, h: 2, minW: 1, minH: 1 },
    ],
  },
  widgets: [
    {
      id: "widget-1",
      type: "api-requests",
      title: "API requests • Inbox",
      width: 2,
      height: 2,
      content: JSON.stringify(apiRequestsMockData),
    },
    {
      id: "widget-2",
      type: "queue-rpc",
      title: "Queue • RPC",
      width: 2,
      height: 2,
      content: JSON.stringify(queueRpcMockData),
    },
    {
      id: "widget-3",
      type: "projects-rds",
      title: "Projects • RDS",
      width: 2,
      height: 2,
      content: JSON.stringify(projectsRdsMockData),
    },
    {
      id: "widget-4",
      type: "system-load",
      title: "System load (1 hour) • ftop",
      width: 2,
      height: 2,
      content: JSON.stringify(generateSystemLoadData()),
    },
  ],
};

// Mock function to save dashboard layout to backend
export const saveDashboardLayout = async (layout: DashboardLayout): Promise<boolean> => {
  console.log('Saving dashboard layout to backend:', layout);
  // Mock delay to simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  return true;
};

// Mock function to load dashboard layout from backend
export const loadDashboardLayout = async (): Promise<DashboardLayout> => {
  console.log('Loading dashboard layout from backend');
  // Mock delay to simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  return defaultDashboardLayout;
};
