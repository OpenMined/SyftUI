"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Database,
  FolderHeart,
  AppWindow,
  ShoppingBag,
  ScrollText,
  Gauge,
  Star,
  ChevronDown,
  ChevronRight,
  LogOut,
  Settings,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { loadFavorites, saveFavorites } from "@/lib/utils/favorites";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ConnectionStatus } from "@/components/connection/connection-status";
import { useRouter, usePathname } from "next/navigation";
import { LogoComponent } from "./logo";
import { useFileSystemStore } from "@/stores/useFileSystemStore";

interface SidebarProps {
  closeSidebar: () => void;
}

export function Sidebar({ closeSidebar }: SidebarProps) {
  const [favorites, setFavorites] = useState<
    { id: string; name: string; path: string[] }[]
  >([]);
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    favorites: true,
  });
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { navigateTo } = useFileSystemStore.getState();

  // Load favorites from localStorage on initial render
  useEffect(() => {
    const savedFavorites = loadFavorites();
    if (savedFavorites.length > 0) {
      setFavorites(savedFavorites);
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  // User email for "My datasite" path
  const userEmail = "user@example.com";

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
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      action: () => {
        setActiveItem("Dashboard");
        router.push("/dashboard/");
        closeSidebar();
      },
    },
    {
      icon: Database,
      label: "Workspace",
      action: () => {
        setActiveItem("Workspace");
        navigateTo([]);
        router.push("/workspace/");
        closeSidebar();
      },
    },
    {
      icon: AppWindow,
      label: "Apps",
      action: () => {
        setActiveItem("Apps");
        router.push("/apps/");
        closeSidebar();
      },
    },
    {
      icon: ShoppingBag,
      label: "Marketplace",
      action: () => {
        setActiveItem("Marketplace");
        router.push("/marketplace/");
        closeSidebar();
      },
    },
    {
      icon: ScrollText,
      label: "Logs",
      action: () => {
        setActiveItem("Logs");
        router.push("/logs/");
        closeSidebar();
      },
    },
    {
      icon: Gauge,
      label: "Diagnostic",
      action: () => {
        setActiveItem("Diagnostic");
        router.push("/diagnostic/");
        closeSidebar();
      },
    },
  ];

  const handleProfileClick = () => {
    router.push("/profile/");
    closeSidebar();
  };

  const handleSettingsClick = () => {
    router.push("/settings/");
    closeSidebar();
  };

  const handleLogoutClick = () => {
    router.push("/");
    closeSidebar();
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

  return (
    <div className="bg-card border-border flex h-full w-full flex-col border-r">
      <div className="mx-4 flex items-center justify-between gap-2 pt-4">
        <LogoComponent />
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={closeSidebar}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="border-border mx-4 flex items-center justify-between border-b pt-2 pb-4">
        <ConnectionStatus />
      </div>
      <nav className="flex-1 overflow-auto p-2">
        <ul className="mb-4 space-y-1">
          {mainNavItems.map((item, index) => (
            <li key={index}>
              <Button
                variant="ghost"
                size="small"
                onClick={item.action}
                className={cn(
                  "flex w-full items-center justify-start gap-3 px-3 py-2 font-normal",
                  activeItem === item.label &&
                    "bg-accent text-accent-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Button>
            </li>
          ))}
        </ul>

        <div className="mb-4">
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
                          closeSidebar();
                        }}
                        className="hover:bg-accent hover:text-accent-foreground flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
                      >
                        <FolderHeart className="h-4 w-4" />
                        <span className="truncate">{fav.name}</span>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => removeFavorite(fav.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </nav>
      <div className="border-border border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full">
            <div className="hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-md p-2 transition-colors">
              <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full">
                U
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">User Name</p>
                <p className="text-muted-foreground text-xs">{userEmail}</p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleProfileClick}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSettingsClick}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogoutClick}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
