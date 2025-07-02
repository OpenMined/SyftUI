"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { BugReportDialog } from "@/components/diagnostic/bug-report-dialog";
import { ConnectionStatus } from "@/components/connection/connection-status";
import { LogoComponent } from "@/components/logo/logo";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useConnectionStore,
  useFileSystemStore,
  useSidebarStore,
} from "@/stores";
import {
  AppWindow,
  Bug,
  ChevronDown,
  ChevronRight,
  Database,
  Folder,
  Heart,
  LogOut,
  Power,
  ScrollText,
  Star,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EMAIL_PLACEHOLDER = "user@example.com";

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [isDragActive, setIsDragActive] = useState(false);
  const { navigateTo } = useFileSystemStore();
  const { datasite } = useConnectionStore();
  const [email, setEmail] = useState<string>(EMAIL_PLACEHOLDER);

  // Use Zustand store for sidebar state
  const {
    activeItem,
    favorites,
    openSections,
    removeFavorite,
    setActiveItem,
    toggleSection,
  } = useSidebarStore();

  useEffect(() => {
    setEmail(datasite?.email ?? EMAIL_PLACEHOLDER);
  }, [datasite?.email]);

  // Add global drag event listeners
  useEffect(() => {
    const handleGlobalDragStart = (e: DragEvent) => {
      // Check if the dragged item is a valid type (app or folder)
      const dataTransfer = e.dataTransfer;
      if (dataTransfer) {
        try {
          // Try to get the JSON data and validate it's a valid app or folder
          const jsonData = dataTransfer.getData("application/json");
          if (jsonData) {
            const item = JSON.parse(jsonData);
            // Check if it's a valid app or folder item
            if (item && (item.type === "app" || item.type === "folder")) {
              setIsDragActive(true);
            }
          }
        } catch (err) {
          // If JSON parsing fails, it's not a valid item for favorites
          console.debug("Drag data is not a valid app or folder item:", err);
        }
      }
    };

    const handleGlobalDragEnd = () => {
      setIsDragActive(false);
    };

    document.addEventListener("dragstart", handleGlobalDragStart);
    document.addEventListener("dragend", handleGlobalDragEnd);

    return () => {
      document.removeEventListener("dragstart", handleGlobalDragStart);
      document.removeEventListener("dragend", handleGlobalDragEnd);
    };
  }, []);

  const getActiveItem = (pathname: string) => {
    if (pathname.startsWith("/diagnostic")) return "Diagnostic";
    if (pathname.startsWith("/logs")) return "Logs";
    if (pathname.startsWith("/marketplace")) return "Marketplace";
    if (pathname.startsWith("/apps")) return "Apps";
    if (pathname.startsWith("/workspace")) return "Workspace";
    if (pathname.startsWith("/dashboard")) return "Dashboard";
    return "";
  };

  // Update activeItem when pathname changes
  useEffect(() => {
    const newActiveItem = getActiveItem(pathname);
    setActiveItem(newActiveItem);
  }, [pathname, setActiveItem]);

  const mainNavItems = [
    // TODO: enable features once we implement them, hide for now
    // {
    //   icon: LayoutDashboard,
    //   label: "Dashboard",
    //   action: () => {
    //     setActiveItem("Dashboard");
    //     router.push("/dashboard/");
    //     closeSidebar();
    //   },
    // },
    {
      icon: Database,
      label: "Workspace",
      action: () => {
        setActiveItem("Workspace");
        navigateTo([]);
        router.push("/workspace/");
      },
    },
    {
      icon: AppWindow,
      label: "Apps",
      action: () => {
        setActiveItem("Apps");
        router.push("/apps/");
      },
    },
    // {
    //   icon: ShoppingBag,
    //   label: "Marketplace",
    //   action: () => {
    //     setActiveItem("Marketplace");
    //     router.push("/marketplace/");
    //   },
    // },
    {
      icon: ScrollText,
      label: "Logs",
      action: () => {
        setActiveItem("Logs");
        router.push("/logs/");
      },
    },
    // {
    //   icon: Gauge,
    //   label: "Diagnostic",
    //   action: () => {
    //     setActiveItem("Diagnostic");
    //     router.push("/diagnostic/");
    //     closeSidebar();
    //   },
    // },
  ];

  // const handleProfileClick = () => {
  //   router.push("/profile/");
  //   closeSidebar();
  // };

  // const handleSettingsClick = () => {
  //   router.push("/settings/");
  //   closeSidebar();
  // };

  const handleLogoutClick = () => {
    router.push("/");
  };

  const handleExitClick = async () => {
    if (window?.__TAURI__?.process !== undefined) {
      await window.__TAURI__.process.exit();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const data = e.dataTransfer.getData("application/json");
    if (data) {
      try {
        const item = JSON.parse(data);
        const { addFavorite } = useSidebarStore.getState();
        if (item.type === "folder") {
          addFavorite({
            id: item.id,
            name: item.name,
            type: "folder",
            path: [...item.path, item.name],
          });
        } else if (item.type === "app") {
          addFavorite({
            id: item.id,
            name: item.name,
            type: "app",
          });
        }
      } catch (err) {
        console.error("Failed to parse drag data", err);
      }
    }
  };

  const handleRemoveFavorite = (id: string, e: React.MouseEvent) => {
    e?.stopPropagation();
    removeFavorite(id);
  };

  return (
    <>
      <SidebarHeader className="border-border mx-4 flex items-center justify-between gap-2 border-b px-0 py-4 pt-12">
        <LogoComponent className="h-16" />
        <div className="flex w-full items-center justify-between">
          <ConnectionStatus />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarMenu>
            {mainNavItems.map((item, index) => (
              <SidebarMenuItem key={index}>
                <SidebarMenuButton
                  onClick={item.action}
                  isActive={activeItem === item.label}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <Collapsible
            open={openSections.favorites}
            onOpenChange={() => toggleSection("favorites")}
          >
            <CollapsibleTrigger className="flex w-full items-center px-3 py-2 text-sm font-medium">
              {openSections.favorites ? (
                <ChevronDown className="mr-1 h-4 w-4" />
              ) : (
                <ChevronRight className="mr-1 h-4 w-4" />
              )}
              <Star className="mr-2 h-4 w-4" />
              <span>Favorites</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div
                className={cn(
                  "space-y-1 py-2 pr-2 pl-4 transition-colors",
                  isDragActive &&
                    "bg-accent/50 border-primary rounded-md border-2 border-dashed",
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {favorites.length === 0 ? (
                  <p className="text-muted-foreground px-3 py-2 text-xs">
                    {isMobile
                      ? "Use the star button to add favorites"
                      : "Drag folders or apps here to add to favorites"}
                  </p>
                ) : (
                  favorites.map((fav) => (
                    <div
                      key={fav.id}
                      className="group flex items-center justify-between"
                    >
                      <button
                        onClick={() => {
                          if (fav.type === "folder" && fav.path) {
                            navigateTo(fav.path);
                            router.push(
                              `/workspace/?path=${fav.path.join("/")}`,
                            );
                          } else if (fav.type === "app") {
                            router.push(`/apps/?id=${fav.id}`);
                          }
                        }}
                        className="hover:bg-accent hover:text-accent-foreground flex flex-1 items-center gap-2 overflow-hidden rounded-md px-3 py-2 text-sm transition-colors"
                      >
                        {fav.type === "folder" ? (
                          <div className="relative">
                            <Folder className="h-4 w-4" />
                            <Heart className="absolute -right-[1px] -bottom-[1px] h-2 w-2 fill-white stroke-4" />
                          </div>
                        ) : (
                          <div className="relative">
                            <AppWindow className="h-4 w-4" />
                            <Heart className="absolute -right-[1px] -bottom-[1px] h-2 w-2 fill-white stroke-4" />
                          </div>
                        )}
                        <span className="flex-1 truncate text-start">
                          {fav.name}
                        </span>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={(e) => handleRemoveFavorite(fav.id, e)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <BugReportDialog
          trigger={
            <Button
              variant="destructive"
              size="sm"
              className="relative z-10 w-full cursor-pointer"
            >
              <Bug className="h-4 w-4" />
              Report Bug
            </Button>
          }
        />

        <div className="border-border mt-4 border-t pt-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full">
              <div className="hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-md p-2 transition-colors">
                <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full">
                  {email.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">
                    {email.split("@")[0].charAt(0).toUpperCase() +
                      email.split("@")[0].slice(1)}
                  </p>
                  <p className="text-muted-foreground text-xs">{email}</p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* <DropdownMenuItem onClick={handleProfileClick}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSettingsClick}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator /> */}
              {typeof window !== "undefined" &&
              window.__TAURI__ !== undefined ? (
                <DropdownMenuItem onClick={handleExitClick}>
                  <Power className="mr-2 h-4 w-4" />
                  <span>Exit</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleLogoutClick}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
    </>
  );
}
