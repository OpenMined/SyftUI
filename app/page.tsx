"use client"

import { Toolbar } from "@/components/ui/toolbar"
import { Check, LayoutDashboard, Pencil, Plus } from "lucide-react"
import { Dashboard } from "@/components/dashboard/dashboard"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  const [isEditing, setIsEditing] = useState(false);

  // Toggle dashboard edit mode
  const toggleEditMode = () => {
    // Access the method exposed by the Dashboard component
    if (typeof window !== 'undefined' && window.dashboardControls) {
      window.dashboardControls.toggleEditMode();
      setIsEditing(!isEditing);
    }
  };

  // Open add widget dialog
  const openAddWidgetDialog = () => {
    if (typeof window !== 'undefined' && window.dashboardControls) {
      window.dashboardControls.openAddWidgetDialog();
    }
  };

  // Custom toolbar buttons for the dashboard
  const toolbarRightSection = (
    <div className="flex items-center gap-2">
      {isEditing && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={openAddWidgetDialog}
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Widget
        </Button>
      )}
      <Button
        variant={isEditing ? "default" : "outline"}
        size="sm"
        onClick={toggleEditMode}
        className="flex items-center gap-1"
      >
        {isEditing ? (
          <>
            <Check className="h-4 w-4" />
            Done
          </>
        ) : (
          <>
            <Pencil className="h-4 w-4" />
            Edit
          </>
        )}
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <Toolbar
        title="Dashboard"
        icon={<LayoutDashboard className="h-5 w-5" />}
        rightSection={toolbarRightSection}
      />
      <div className="flex-1 overflow-auto">
        <Dashboard />
      </div>
    </div>
  )
}
