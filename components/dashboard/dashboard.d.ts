interface DashboardControls {
  toggleEditMode: () => void;
  openAddWidgetDialog: () => void;
}

interface Window {
  dashboardControls?: DashboardControls;
  saveLayoutDebounce?: number;
}
