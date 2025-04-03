import { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Widget } from './widget-base';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  DashboardLayout,
  availableWidgets,
  loadDashboardLayout,
  saveDashboardLayout,
  WidgetDefinition
} from './mock-data';
import { Pencil, Plus, Check, X, BarChart2, Inbox, List, Server, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// LocalStorage key for saving dashboard layout
const DASHBOARD_LAYOUT_KEY = 'syftui-dashboard-layout';

// Apply width provider to the responsive grid layout
const ResponsiveGridLayout = WidthProvider(Responsive);

// Breakpoints for responsive layout
const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const cols = { lg: 4, md: 4, sm: 2, xs: 1, xxs: 1 };

// For type safety with window
declare global {
  interface Window {
    dashboardControls?: {
      toggleEditMode: (shouldSave?: boolean) => void;
      openAddWidgetDialog: () => void;
      cancelEditMode: () => void;
      resetDashboard: () => Promise<void>;
    };
  }
}

interface DashboardProps {
  initialEditMode?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ initialEditMode = false }) => {
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [originalLayout, setOriginalLayout] = useState<DashboardLayout | null>(null);
  const [isAddWidgetDialogOpen, setIsAddWidgetDialogOpen] = useState(false);
  const [selectedWidgetType, setSelectedWidgetType] = useState<string | null>(null);
  const [dashboardLayout, setDashboardLayout] = useState<DashboardLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [storageAvailable, setStorageAvailable] = useState(true);

  // Check if localStorage is available
  useEffect(() => {
    try {
      localStorage.setItem('storage-test', 'test');
      localStorage.removeItem('storage-test');
      setStorageAvailable(true);
    } catch (e) {
      setStorageAvailable(false);
      console.warn('localStorage is not available. Layout will not persist between sessions.');
    }
  }, []);

  // Load dashboard layout on component mount
  useEffect(() => {
    const fetchLayout = async () => {
      try {
        let layout: DashboardLayout;

        // Try to load from localStorage first
        if (storageAvailable) {
          const savedLayout = localStorage.getItem(DASHBOARD_LAYOUT_KEY);
          if (savedLayout) {
            try {
              layout = JSON.parse(savedLayout);
              console.log('Loaded layout from localStorage');
              setDashboardLayout(layout);
              // Store original layout for reset functionality
              setOriginalLayout(JSON.parse(JSON.stringify(layout)));
              setLoading(false);
              return;
            } catch (e) {
              console.warn('Failed to parse saved layout, falling back to default');
              // If parsing fails, continue to load default layout
            }
          }
        }

        // If no localStorage or parsing failed, load from backend mock
        layout = await loadDashboardLayout();
        setDashboardLayout(layout);
        // Store original layout for reset functionality
        setOriginalLayout(JSON.parse(JSON.stringify(layout)));
      } catch (error) {
        console.error('Failed to load dashboard layout:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load dashboard layout",
          icon: "❌"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLayout();
  }, [storageAvailable]);

  // Save layout on changes
  const saveLayout = async (layout: DashboardLayout, updateOriginal: boolean = false) => {
    try {
      // Save to localStorage if available
      if (storageAvailable) {
        localStorage.setItem(DASHBOARD_LAYOUT_KEY, JSON.stringify(layout));
      }

      // Also save to mock backend for demonstration
      await saveDashboardLayout(layout);

      // Update original layout if specified (typically after a successful save)
      if (updateOriginal) {
        setOriginalLayout(JSON.parse(JSON.stringify(layout)));
      }

      toast({
        title: "Success",
        description: "Dashboard layout saved",
        icon: "✅"
      });
    } catch (error) {
      console.error('Failed to save dashboard layout:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save dashboard layout",
        icon: "❌"
      });
    }
  };

  // Handle layout change
  const handleLayoutChange = (layout: any, layouts: any) => {
    if (!dashboardLayout || !layouts) return;

    const updatedLayout: DashboardLayout = {
      ...dashboardLayout,
      layouts,
    };

    // Just update the state without saving to storage
    setDashboardLayout(updatedLayout);
  };



  // Handle adding a new widget
  const handleAddWidget = () => {
    if (!selectedWidgetType || !dashboardLayout) return;

    const widgetToAdd = availableWidgets.find(w => w.type === selectedWidgetType);
    if (!widgetToAdd) return;

    const newWidgetId = `widget-${uuidv4()}`;

    // Create new widget
    const newWidget: WidgetDefinition = {
      ...widgetToAdd,
      id: newWidgetId,
    };

    // Determine position for new widget
    const currentLayoutCount = dashboardLayout.widgets.length;
    const newLayoutItem = {
      i: newWidgetId,
      x: currentLayoutCount % 2 * 2,
      y: Math.floor(currentLayoutCount / 2) * 2,
      w: widgetToAdd.width,
      h: widgetToAdd.height,
      minW: widgetToAdd.minWidth || 1,
      minH: widgetToAdd.minHeight || 1,
    };

    // Update layouts for all breakpoints
    const updatedLayouts = { ...dashboardLayout.layouts };
    Object.keys(updatedLayouts).forEach(breakpoint => {
      if (breakpoint === 'xs' || breakpoint === 'xxs') {
        updatedLayouts[breakpoint] = [
          ...updatedLayouts[breakpoint],
          { ...newLayoutItem, w: 1, x: 0, y: updatedLayouts[breakpoint].length * 2 }
        ];
      } else if (breakpoint === 'sm') {
        updatedLayouts[breakpoint] = [
          ...updatedLayouts[breakpoint],
          { ...newLayoutItem, w: 2, x: 0, y: updatedLayouts[breakpoint].length * 2 }
        ];
      } else {
        updatedLayouts[breakpoint] = [...updatedLayouts[breakpoint], newLayoutItem];
      }
    });

    // Update dashboard layout state without saving
    const updatedDashboardLayout: DashboardLayout = {
      layouts: updatedLayouts,
      widgets: [...dashboardLayout.widgets, newWidget],
    };

    setDashboardLayout(updatedDashboardLayout);
    setIsAddWidgetDialogOpen(false);
    setSelectedWidgetType(null);

    // Show notification for widget addition
    toast({
      title: "Widget Added",
      description: `Added ${widgetToAdd.title} widget`,
      icon: "➕"
    });
  };

  // Handle removing a widget
  const handleRemoveWidget = (widgetId: string) => {
    if (!dashboardLayout) return;

    // Filter out the widget to remove
    const updatedWidgets = dashboardLayout.widgets.filter(w => w.id !== widgetId);

    // Update layouts for all breakpoints
    const updatedLayouts = { ...dashboardLayout.layouts };
    Object.keys(updatedLayouts).forEach(breakpoint => {
      updatedLayouts[breakpoint] = updatedLayouts[breakpoint].filter(item => item.i !== widgetId);
    });

    // Update dashboard layout state without saving
    const updatedDashboardLayout: DashboardLayout = {
      layouts: updatedLayouts,
      widgets: updatedWidgets,
    };

    setDashboardLayout(updatedDashboardLayout);

    // Show notification for widget removal
    toast({
      title: "Widget Removed",
      description: "Widget has been removed from dashboard",
      icon: "🗑️"
    });
  };

  // Handle toggling edit mode
  const toggleEditMode = (shouldSave = true) => {
    if (isEditing && shouldSave) {
      // Save layout when exiting edit mode with visible notification
      if (dashboardLayout) {
        saveLayout(dashboardLayout, true); // Update original layout after saving
      }
    }
    setIsEditing(!isEditing);
  };

  // Handle canceling edit mode
  const cancelEditMode = () => {
    // Restore original layout
    if (originalLayout) {
      setDashboardLayout(JSON.parse(JSON.stringify(originalLayout)));
    }
    // Exit edit mode without saving
    toggleEditMode(false);
    toast({
      title: "Changes Discarded",
      description: "Edit changes have been discarded",
      icon: "ℹ️"
    });
  };

  // Handle resetting dashboard to default
  const resetDashboard = async () => {
    try {
      setLoading(true);
      // Load default layout from backend
      const defaultLayout = await loadDashboardLayout();
      setDashboardLayout(defaultLayout);
      setOriginalLayout(JSON.parse(JSON.stringify(defaultLayout)));

      // Save to localStorage if available
      if (storageAvailable) {
        localStorage.setItem(DASHBOARD_LAYOUT_KEY, JSON.stringify(defaultLayout));
      }

      toast({
        title: "Dashboard Reset",
        description: "Dashboard has been reset to default layout",
        icon: "🔄"
      });
      // Exit edit mode
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to reset dashboard:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reset dashboard",
        icon: "❌"
      });
    } finally {
      setLoading(false);
    }
  };

  // Expose dashboard controls to parent components
  useEffect(() => {
    if (window) {
      window.dashboardControls = {
        toggleEditMode,
        openAddWidgetDialog: () => setIsAddWidgetDialogOpen(true),
        cancelEditMode,
        resetDashboard
      };
    }
    return () => {
      if (window) {
        delete window.dashboardControls;
      }
    };
  }, [toggleEditMode, cancelEditMode, resetDashboard]);

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Render dashboard
  return (
    <div className="h-full relative">
      {dashboardLayout && (
        <div className={`p-4 ${isEditing ? 'dashboard-editing' : ''}`}>
          <ResponsiveGridLayout
            className="layout"
            layouts={dashboardLayout.layouts}
            breakpoints={breakpoints}
            cols={cols}
            rowHeight={150}
            margin={[16, 16]}
            containerPadding={[0, 0]}
            onLayoutChange={handleLayoutChange}
            draggableHandle=".handle"
            draggableCancel=".remove-handle"
            isDraggable={isEditing}
            isResizable={isEditing}
            useCSSTransforms={true}
            compactType="vertical"
          >
            {dashboardLayout.widgets.map(widget => (
              <div key={widget.id} className="widget-container select-none">
                <Widget
                  widget={widget}
                  onRemove={handleRemoveWidget}
                  isEditing={isEditing}
                />
              </div>
            ))}
          </ResponsiveGridLayout>
        </div>
      )}

      {/* Add Widget Dialog */}
      <Dialog open={isAddWidgetDialogOpen} onOpenChange={setIsAddWidgetDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Add Widget</DialogTitle>
            <DialogDescription>
              Select a widget to add to your dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-4">
            {availableWidgets.map(widget => (
              <div
                key={widget.type}
                className={`
                  border rounded-lg p-3 cursor-pointer transition-all flex items-center justify-between
                  ${selectedWidgetType === widget.type ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                `}
                onClick={() => setSelectedWidgetType(widget.type)}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2 flex items-center justify-center">
                    {getWidgetIcon(widget.type)}
                  </div>
                  <div>
                    <h3 className="font-medium">{widget.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {widget.subtitle || getWidgetDescription(widget.type)}
                    </p>
                  </div>
                </div>
                {selectedWidgetType === widget.type && (
                  <div className="w-5 h-5 text-primary">
                    <Check className="h-5 w-5" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddWidgetDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddWidget}
              disabled={!selectedWidgetType}
            >
              Add Widget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile editing instructions */}
      {isEditing && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 md:hidden">
          <p className="text-sm text-center">
            Tap and hold widget headers to move. Drag edges to resize.
          </p>
        </div>
      )}

      <style jsx global>{`
        .widget-container {
          transition: all 0.2s;
        }
        .dashboard-editing .react-grid-item {
          border: 2px dashed #e5e7eb;
          background: rgba(255, 255, 255, 0.05);
        }
        .react-grid-item.react-grid-placeholder {
          background: #3b82f6;
          opacity: 0.2;
          border-radius: 8px;
          transition-duration: 100ms;
        }
        .react-resizable-handle {
          opacity: ${isEditing ? 0.5 : 0};
          transition: opacity 0.2s;
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3L21 3L21 9" /><path d="M9 21L3 21L3 15" /><path d="M21 3L14 10" /><path d="M3 21L10 14" /></svg>');
          background-position: bottom right;
          padding: 0 3px 3px 0;
        }
        .dark .react-resizable-handle {
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3L21 3L21 9" /><path d="M9 21L3 21L3 15" /><path d="M21 3L14 10" /><path d="M3 21L10 14" /></svg>');
        }
      `}</style>
    </div>
  );
};

// Helper function to get widget icon
function getWidgetIcon(type: string): React.ReactNode {
  switch (type) {
    case 'api-requests':
      return <Inbox className="h-4 w-4 text-primary" />;
    case 'api-broadcast':
      return <Send className="h-4 w-4 text-primary" />;
    case 'queue-rpc':
      return <Server className="h-4 w-4 text-primary" />;
    case 'projects-rds':
      return <List className="h-4 w-4 text-primary" />;
    case 'system-load':
      return <BarChart2 className="h-4 w-4 text-primary" />;
    default:
      return <div className="h-4 w-4" />;
  }
}

// Helper function to get widget description
function getWidgetDescription(type: string): string {
  switch (type) {
    case 'api-requests':
      return 'View and manage incoming API requests';
    case 'queue-rpc':
      return 'Monitor RPC queue status and progress';
    case 'projects-rds':
      return 'Track remote data science projects';
    case 'system-load':
      return 'Monitor system resource usage';
    default:
      return 'Widget description';
  }
}
