"use client"

import { Toolbar } from "@/components/ui/toolbar"
import { Check, LayoutDashboard, Pencil, Plus, X, RotateCcw } from "lucide-react"
import { Dashboard } from "@/components/dashboard"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function HomePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  // Toggle dashboard edit mode
  const toggleEditMode = () => {
    // Access the method exposed by the Dashboard component
    if (typeof window !== 'undefined' && window.dashboardControls) {
      window.dashboardControls.toggleEditMode();
      setIsEditing(!isEditing);
    }
  };

  // Cancel dashboard edit mode
  const cancelEditMode = () => {
    if (typeof window !== 'undefined' && window.dashboardControls) {
      window.dashboardControls.cancelEditMode();
      setIsEditing(false);
    }
  };

  // Reset dashboard to default
  const resetDashboard = async () => {
    if (typeof window !== 'undefined' && window.dashboardControls) {
      await window.dashboardControls.resetDashboard();
      setIsEditing(false);
      setIsResetDialogOpen(false);
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
      {isEditing ? (
        <>
          <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Dashboard</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset the dashboard to its default layout. All customizations will be lost.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={resetDashboard}>Reset</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            variant="outline"
            size="sm"
            onClick={openAddWidgetDialog}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Widget
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={cancelEditMode}
            className="flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={toggleEditMode}
            className="flex items-center gap-1"
          >
            <Check className="h-4 w-4" />
            Save
          </Button>
        </>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={toggleEditMode}
          className="flex items-center gap-1"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      )}
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
