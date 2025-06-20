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
import { cn } from "@/lib/utils";
import { loadFavorites, saveFavorites } from "@/lib/utils/favorites";
import { useConnectionStore, useFileSystemStore } from "@/stores";
import {
  AppWindow,
  Bug,
  ChevronDown,
  ChevronRight,
  Database,
  FolderHeart,
  LogOut,
  Power,
  ScrollText,
  Star,
  X,
} from "lucide-react";

const EMAIL_PLACEHOLDER = "user@example.com";

export function AppSidebar() {
  const [favorites, setFavorites] = useState<
    { id: string; name: string; path: string[] }[]
  >([]);
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    favorites: true,
  });
  const [hasOpenedBugReport, setHasOpenedBugReport] = useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { navigateTo } = useFileSystemStore();
  const { datasite } = useConnectionStore();
  const [email, setEmail] = useState<string>(EMAIL_PLACEHOLDER);

  // Load favorites from localStorage on initial render
  useEffect(() => {
    const savedFavorites = loadFavorites();
    if (savedFavorites.length > 0) {
      setFavorites(savedFavorites);
    }
  }, []);

  useEffect(() => {
    setEmail(datasite?.email ?? EMAIL_PLACEHOLDER);
  }, [datasite?.email]);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  // Load bug report dialog state from localStorage on initial render
  useEffect(() => {
    const hasOpened = localStorage.getItem("hasOpenedBugReport");
    setHasOpenedBugReport(hasOpened === "true");
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

  const [activeItem, setActiveItem] = useState(getActiveItem(pathname));

  // Update activeItem when pathname changes
  useEffect(() => {
    setActiveItem(getActiveItem(pathname));
  }, [pathname]);

  // Listen for add-to-favorites events
  useEffect(() => {
    const handleAddToFavorites = (event: Event) => {
      const detail = event.detail;

      if (detail && detail.id && detail.name) {
        // Check if already in favorites
        if (!favorites.some((fav) => fav.id === detail.id)) {
          setFavorites((prev) => [
            ...prev,
            {
              id: detail.id,
              name: detail.name,
              path: detail.path || [],
            },
          ]);
        }
      }
    };

    window.addEventListener("add-to-favorites", handleAddToFavorites);

    return () => {
      window.removeEventListener("add-to-favorites", handleAddToFavorites);
    };
  }, [favorites]);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

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
    //     closeSidebar();
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/json");
    if (data) {
      try {
        const item = JSON.parse(data);
        if (item.type === "folder") {
          // Check if already in favorites
          if (!favorites.some((fav) => fav.id === item.id)) {
            // Make sure path is properly formatted

            setFavorites((prev) => [
              ...prev,
              {
                id: item.id,
                name: item.name,
                path: [...item.path, item.name],
              },
            ]);
          }
        }
      } catch (err) {
        console.error("Failed to parse drag data", err);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const removeFavorite = (id: string, e: React.MouseEvent) => {
    e?.stopPropagation();
    setFavorites((prev) => prev.filter((fav) => fav.id !== id));
  };

  const handleBugReportOpen = () => {
    setHasOpenedBugReport(true);
    localStorage.setItem("hasOpenedBugReport", "true");
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
                className="space-y-1 py-2 pr-2 pl-4"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {favorites.length === 0 ? (
                  <p className="text-muted-foreground px-3 py-2 text-xs">
                    {isMobile
                      ? "Use the star button to add favorites"
                      : "Drag folders here to add to favorites"}
                  </p>
                ) : (
                  favorites.map((fav) => (
                    <div
                      key={fav.id}
                      className="group flex items-center justify-between"
                    >
                      <button
                        onClick={() => {
                          navigateTo(fav.path);
                          router.push(`/workspace/?path=${fav.path.join("/")}`);
                        }}
                        className="hover:bg-accent hover:text-accent-foreground flex flex-1 items-center gap-2 overflow-hidden rounded-md px-3 py-2 text-sm transition-colors"
                      >
                        <FolderHeart className="h-4 w-4" />
                        <span className="flex-1 truncate text-start">
                          {fav.name}
                        </span>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={(e) => removeFavorite(fav.id, e)}
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
              className={cn(
                "relative z-10 w-full cursor-pointer",
                !hasOpenedBugReport && "pulsate-border",
              )}
              onClick={handleBugReportOpen}
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
