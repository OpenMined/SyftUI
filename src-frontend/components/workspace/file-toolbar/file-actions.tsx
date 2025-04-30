"use client";

import { useState, useEffect } from "react";
import { useFileSystemStore } from "@/stores/useFileSystemStore";
import { Grid, List } from "lucide-react";
import { addToFavorites } from "@/lib/utils/favorites";
import {
  FolderPlus,
  Upload,
  Trash2,
  Scissors,
  Copy,
  Clipboard,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  ArrowUpDown,
  Star,
  FilePlus,
  TextCursorInput,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { FileSystemItem } from "@/lib/types";

export function FileActions() {
  const {
    clipboard,
    cutItems,
    copyItems,
    pasteItems,
    selectedItems,
    handleCreateFolder,
    handleCreateFile,
    handleDelete,
    handleRename,
    isRefreshing,
    refreshFileSystem,
    sortConfig,
    setSortConfig,
    fileSystem,
    currentPath,
    syncPaused,
    setSyncDialogOpen,
    viewMode,
    setViewMode,
  } = useFileSystemStore();

  // Check if any selected items are folders
  const hasSelectedFolder =
    selectedItems.length === 1 &&
    fileSystem
      .filter((item) => item.id === selectedItems[0])
      .some((item) => item.type === "folder");

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreateFileOpen, setIsCreateFileOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const handleCreateFolderSubmit = () => {
    if (newFolderName.trim()) {
      handleCreateFolder(newFolderName.trim());
      setNewFolderName("");
      setIsCreateFolderOpen(false);
    }
  };

  const handleCreateFileSubmit = () => {
    if (newFileName.trim()) {
      handleCreateFile(newFileName.trim());
      setNewFileName("");
      setIsCreateFileOpen(false);
    }
  };

  const handleRenameSubmit = () => {
    if (selectedItems.length === 1 && renameValue.trim()) {
      handleRename(selectedItems[0], renameValue.trim());
      setRenameValue("");
      setIsRenameOpen(false);
    }
  };

  const openRenameDialog = () => {
    if (selectedItems.length === 1) {
      // Find the selected item to get its current name
      const findItemById = (
        id: string,
        items: FileSystemItem[],
      ): FileSystemItem | null => {
        for (const item of items) {
          if (item.id === id) return item;
          if (item.type === "folder" && item.children) {
            const found = findItemById(id, item.children);
            if (found) return found;
          }
        }
        return null;
      };

      const selectedItem = findItemById(selectedItems[0], fileSystem);
      if (selectedItem) {
        setRenameValue(selectedItem.name);
        setIsRenameOpen(true);
      }
    }
  };

  // Function to handle favoriting the selected folder
  const handleAddToFavorites = () => {
    if (hasSelectedFolder) {
      const selectedFolderId = selectedItems[0];
      const folder = fileSystem.find((item) => item.id === selectedFolderId);

      if (folder && folder.type === "folder") {
        addToFavorites({
          id: folder.id,
          name: folder.name,
          type: folder.type,
          path: currentPath,
        });
      }
    }
  };

  // Sync status button
  const renderSyncStatusButton = () => {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setSyncDialogOpen(true)}
        className="flex items-center gap-2"
      >
        {syncPaused ? (
          <>
            <PauseCircle className="h-4 w-4 text-yellow-500" />
            <span className="hidden text-yellow-500 sm:inline">
              Sync Paused
            </span>
          </>
        ) : (
          <>
            <PlayCircle className="h-4 w-4 text-green-500" />
            <span className="hidden text-green-500 sm:inline">Sync Active</span>
          </>
        )}
      </Button>
    );
  };

  // State for tracking which menu is open
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isCompactView, setIsCompactView] = useState(false);

  // Effect to detect viewport width and set compact mode
  useEffect(() => {
    function handleResize() {
      setIsCompactView(window.innerWidth < 640); // sm breakpoint in Tailwind
    }

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handler for toggling menu open/close
  const toggleMenu = (menu: string) => {
    if (activeMenu === menu) {
      setActiveMenu(null);
    } else {
      setActiveMenu(menu);
    }
  };

  return (
    <>
      {/* Sync status button */}
      {renderSyncStatusButton()}

      {isCompactView ? (
        /* Compact Menu - Single dropdown with all options */
        <div className="ml-1 flex items-center gap-1">
          <DropdownMenu
            open={activeMenu === "menu"}
            onOpenChange={(open) => setActiveMenu(open ? "menu" : null)}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`${activeMenu === "menu" ? "bg-accent" : ""}`}
                onClick={() => toggleMenu("menu")}
              >
                <ChevronDown className="mr-2 h-4 w-4" />
                Menu
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {/* File Section */}
              <div className="text-muted-foreground px-2 py-1 text-xs font-semibold">
                File
              </div>
              <DropdownMenuItem onClick={() => setIsCreateFileOpen(true)}>
                <FilePlus className="mr-2 h-4 w-4" />
                New File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsCreateFolderOpen(true)}>
                <FolderPlus className="mr-2 h-4 w-4" />
                New Folder
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={refreshFileSystem}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Edit Section */}
              <div className="text-muted-foreground px-2 py-1 text-xs font-semibold">
                Edit
              </div>
              <DropdownMenuItem
                onClick={openRenameDialog}
                disabled={selectedItems.length !== 1}
                className={selectedItems.length !== 1 ? "opacity-50" : ""}
              >
                <TextCursorInput className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => cutItems(selectedItems)}
                disabled={selectedItems.length === 0}
                className={selectedItems.length === 0 ? "opacity-50" : ""}
              >
                <Scissors className="mr-2 h-4 w-4" />
                Cut
                <DropdownMenuShortcut>⌘X</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => copyItems(selectedItems)}
                disabled={selectedItems.length === 0}
                className={selectedItems.length === 0 ? "opacity-50" : ""}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy
                <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={pasteItems}
                disabled={!clipboard}
                className={!clipboard ? "opacity-50" : ""}
              >
                <Clipboard className="mr-2 h-4 w-4" />
                Paste
                <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleAddToFavorites}
                disabled={!hasSelectedFolder}
                className={!hasSelectedFolder ? "opacity-50" : ""}
              >
                <Star className="mr-2 h-4 w-4 text-yellow-500" />
                Add to Favorites
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(selectedItems)}
                disabled={selectedItems.length === 0}
                className={`${selectedItems.length === 0 ? "opacity-50" : ""} text-destructive focus:text-destructive`}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* View Section */}
              <div className="text-muted-foreground px-2 py-1 text-xs font-semibold">
                View
              </div>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Grid className="mr-2 h-4 w-4" />
                  View Mode
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={viewMode || "grid"}
                    onValueChange={(value) =>
                      setViewMode?.(value as "grid" | "list")
                    }
                  >
                    <DropdownMenuRadioItem value="grid">
                      <Grid className="mr-2 h-4 w-4" />
                      Grid View
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="list">
                      <List className="mr-2 h-4 w-4" />
                      List View
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Sort By
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={sortConfig?.sortBy || "name"}
                    onValueChange={(value) =>
                      setSortConfig?.({
                        ...(sortConfig || { direction: "asc" }),
                        sortBy: value as "name" | "date" | "size" | "type",
                      })
                    }
                  >
                    <DropdownMenuRadioItem value="name">
                      Name
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="date">
                      Date Modified
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="size">
                      Size
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="type">
                      Type
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Direction
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={sortConfig?.direction || "asc"}
                    onValueChange={(value) =>
                      setSortConfig?.({
                        ...(sortConfig || { sortBy: "name" }),
                        direction: value as "asc" | "desc",
                      })
                    }
                  >
                    <DropdownMenuRadioItem value="asc">
                      Ascending
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="desc">
                      Descending
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        /* Regular Menu Bar - Separate File, Edit, View menus */
        <div className="ml-1 flex items-center gap-1">
          {/* File Menu */}
          <DropdownMenu
            open={activeMenu === "file"}
            onOpenChange={(open) => setActiveMenu(open ? "file" : null)}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`${activeMenu === "file" ? "bg-accent" : ""}`}
                onClick={() => toggleMenu("file")}
              >
                File
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => setIsCreateFileOpen(true)}>
                <FilePlus className="mr-2 h-4 w-4" />
                New File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsCreateFolderOpen(true)}>
                <FolderPlus className="mr-2 h-4 w-4" />
                New Folder
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={refreshFileSystem}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Edit Menu */}
          <DropdownMenu
            open={activeMenu === "edit"}
            onOpenChange={(open) => setActiveMenu(open ? "edit" : null)}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`${activeMenu === "edit" ? "bg-accent" : ""}`}
                onClick={() => toggleMenu("edit")}
              >
                Edit
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                onClick={openRenameDialog}
                disabled={selectedItems.length !== 1}
                className={selectedItems.length !== 1 ? "opacity-50" : ""}
              >
                <TextCursorInput className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => cutItems(selectedItems)}
                disabled={selectedItems.length === 0}
                className={selectedItems.length === 0 ? "opacity-50" : ""}
              >
                <Scissors className="mr-2 h-4 w-4" />
                Cut
                <DropdownMenuShortcut>⌘X</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => copyItems(selectedItems)}
                disabled={selectedItems.length === 0}
                className={selectedItems.length === 0 ? "opacity-50" : ""}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy
                <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={pasteItems}
                disabled={!clipboard}
                className={!clipboard ? "opacity-50" : ""}
              >
                <Clipboard className="mr-2 h-4 w-4" />
                Paste
                <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleAddToFavorites}
                disabled={!hasSelectedFolder}
                className={!hasSelectedFolder ? "opacity-50" : ""}
              >
                <Star className="mr-2 h-4 w-4 text-yellow-500" />
                Add to Favorites
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(selectedItems)}
                disabled={selectedItems.length === 0}
                className={`${selectedItems.length === 0 ? "opacity-50" : ""} text-destructive focus:text-destructive`}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Menu */}
          <DropdownMenu
            open={activeMenu === "view"}
            onOpenChange={(open) => setActiveMenu(open ? "view" : null)}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`${activeMenu === "view" ? "bg-accent" : ""}`}
                onClick={() => toggleMenu("view")}
              >
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <div className="text-muted-foreground px-2 py-1 text-xs">
                View mode:
              </div>
              <DropdownMenuRadioGroup
                value={viewMode || "grid"}
                onValueChange={(value) =>
                  setViewMode?.(value as "grid" | "list")
                }
              >
                <DropdownMenuRadioItem value="grid">
                  <Grid className="mr-2 h-4 w-4" />
                  Grid View
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="list">
                  <List className="mr-2 h-4 w-4" />
                  List View
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <div className="text-muted-foreground px-2 py-1 text-xs">
                Sort by:
              </div>
              <DropdownMenuRadioGroup
                value={sortConfig?.sortBy || "name"}
                onValueChange={(value) =>
                  setSortConfig?.({
                    ...(sortConfig || { direction: "asc" }),
                    sortBy: value as "name" | "date" | "size" | "type",
                  })
                }
              >
                <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="date">
                  Date Modified
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="size">Size</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="type">Type</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <div className="text-muted-foreground px-2 py-1 text-xs">
                Direction:
              </div>
              <DropdownMenuRadioGroup
                value={sortConfig?.direction || "asc"}
                onValueChange={(value) =>
                  setSortConfig?.({
                    ...(sortConfig || { sortBy: "name" }),
                    direction: value as "asc" | "desc",
                  })
                }
              >
                <DropdownMenuRadioItem value="asc">
                  Ascending
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="desc">
                  Descending
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            className="mt-4"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateFolderSubmit();
            }}
          />
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsCreateFolderOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateFolderSubmit}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateFileOpen} onOpenChange={setIsCreateFileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New File</DialogTitle>
          </DialogHeader>
          <Input
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="File name"
            className="mt-4"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateFileSubmit();
            }}
          />
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsCreateFileOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateFileSubmit}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Item</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Enter new name"
            className="mt-4"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameSubmit();
            }}
          />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameSubmit}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
