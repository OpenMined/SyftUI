"use client"

import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  Briefcase,
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
} from "lucide-react"
import { cn, getAssetPath } from "@/lib/utils"
import { navigateToPath } from "@/lib/utils/url"
import { loadFavorites, saveFavorites } from "@/lib/utils/favorites"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { ConnectionStatus } from "@/components/connection-status"
import { useTheme } from "next-themes"
import { useRouter, usePathname } from "next/navigation"

interface SidebarProps {
  closeSidebar: () => void
}

export function Sidebar({ closeSidebar }: SidebarProps) {
  const { theme } = useTheme()
  const isDarkTheme = theme === "dark"
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("connected")
  const [favorites, setFavorites] = useState<{ id: string; name: string; path: string[] }[]>([])
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    favorites: true,
  })
  const router = useRouter()
  const pathname = usePathname()
  
  // Load favorites from localStorage on initial render
  useEffect(() => {
    const savedFavorites = loadFavorites();
    if (savedFavorites.length > 0) {
      setFavorites(savedFavorites);
    }
  }, [])
  
  // Save favorites to localStorage whenever they change
  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites])

  // User email for "My datasite" path
  const userEmail = "user@example.com"

  const getActiveItem = (pathname: string) => {
    if (pathname.startsWith("/diagnostic")) return "Diagnostic"
    if (pathname.startsWith("/logs")) return "Logs"
    if (pathname.startsWith("/marketplace")) return "Marketplace"
    if (pathname.startsWith("/apps")) return "Apps"
    if (pathname.startsWith(`/workspace/?path=/datasites/${userEmail}`)) return "My datasite"
    if (pathname.startsWith("/workspace/?path=/datasites")) return "Datasites"
    if (pathname.startsWith("/workspace")) return "Workspace"
    return "Dashboard"
  }

  const [activeItem, setActiveItem] = useState(getActiveItem(pathname))

  // Update activeItem when pathname changes
  useEffect(() => {
    setActiveItem(getActiveItem(pathname))
  }, [pathname])
  
  // Listen for add-to-favorites events
  useEffect(() => {
    const handleAddToFavorites = (event: Event) => {
      const detail = (event as any).detail;
      
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
          ])
        }
      }
    };
    
    window.addEventListener('add-to-favorites', handleAddToFavorites);
    
    return () => {
      window.removeEventListener('add-to-favorites', handleAddToFavorites);
    };
  }, [favorites])

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const mainNavItems = [
    {
      icon: LayoutDashboard, label: "Dashboard", action: () => {
        setActiveItem("Dashboard")
        router.push("/")
        closeSidebar()
      }
    },
    {
      icon: Briefcase,
      label: "Workspace",
      action: () => {
        setActiveItem("Workspace")
        navigateToPath([])
        router.push("/workspace/")
        closeSidebar()
      },
    },
    {
      icon: Database,
      label: "Datasites",
      action: () => {
        setActiveItem("Datasites")
        navigateToPath(["datasites"])
        router.push("/workspace/?path=datasites/")
        closeSidebar()
      },
    },
    {
      icon: FolderHeart,
      label: "My datasite",
      action: () => {
        setActiveItem("My datasite")
        navigateToPath(["datasites", userEmail])
        router.push(`/workspace/?path=datasites/${userEmail}/`)
        closeSidebar()
      }
    },
    {
      icon: AppWindow, label: "Apps", action: () => {
        setActiveItem("Apps")
        router.push("/apps/")
        closeSidebar()
      }
    },
    {
      icon: ShoppingBag,
      label: "Marketplace",
      action: () => {
        setActiveItem("Marketplace")
        router.push("/marketplace/")
        closeSidebar()
      },
    },
    {
      icon: ScrollText,
      label: "Logs",
      action: () => {
        setActiveItem("Logs")
        router.push("/logs/")
        closeSidebar()
      }
    },
    {
      icon: Gauge, label: "Diagnostic", action: () => {
        setActiveItem("Diagnostic")
        router.push("/diagnostic/")
        closeSidebar()
      }
    },
  ]

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const data = e.dataTransfer.getData("application/json")
    if (data) {
      try {
        const item = JSON.parse(data)
        if (item.type === "folder") {
          // Check if already in favorites
          if (!favorites.some((fav) => fav.id === item.id)) {
            // Make sure path is properly formatted
            const itemPath = item.path || []

            setFavorites((prev) => [
              ...prev,
              {
                id: item.id,
                name: item.name,
                path: [...item.path, item.name],
              },
            ])
          }
        }
      } catch (err) {
        console.error("Failed to parse drag data", err)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
  }

  const removeFavorite = (id: string, e: React.MouseEvent) => {
    e?.stopPropagation()
    setFavorites((prev) => prev.filter((fav) => fav.id !== id))
  }

  // Simulate random connection status changes for demo purposes
  useEffect(() => {
    const interval = setInterval(() => {
      const statuses: Array<"connected" | "connecting" | "disconnected"> = ["connected", "connecting", "disconnected"]
      const randomStatus = statuses[Math.floor(Math.random() * 10) % 3]
      setConnectionStatus(randomStatus)
    }, 30000) // Change every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full h-full bg-card border-r border-border flex flex-col">
      <div className="flex justify-between items-center mx-4 pt-4 gap-2">
        <Image src={getAssetPath(isDarkTheme ? "/logo-dark.svg" : "/logo-light.svg")} width={180} height={54} alt="SyftBox UI" />
        <Button variant="ghost" size="icon" className="md:hidden" onClick={closeSidebar}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex justify-between items-center mx-4 pt-2 pb-4 border-b border-border">
        <ConnectionStatus status={connectionStatus} />
      </div>
      <nav className="flex-1 overflow-auto p-2">
        <ul className="space-y-1 mb-4">
          {mainNavItems.map((item, index) => (
            <li key={index}>
              <Button
                variant="ghost"
                size="small"
                onClick={item.action}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 justify-start font-normal",
                  activeItem === item.label && "bg-accent text-accent-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Button>
            </li>
          ))}
        </ul>

        <div className="mb-4">
          <Collapsible open={openSections.favorites} onOpenChange={() => toggleSection("favorites")}>
            <CollapsibleTrigger className="flex items-center w-full px-3 py-2 text-sm font-medium">
              {openSections.favorites ? (
                <ChevronDown className="h-4 w-4 mr-1" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-1" />
              )}
              <Star className="h-4 w-4 mr-2" />
              <span>Favorites</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pl-4 pr-2 py-2 space-y-1" onDrop={handleDrop} onDragOver={handleDragOver}>
                {favorites.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-3 py-2">Drag folders here to add to favorites</p>
                ) : (
                  favorites.map((fav) => (
                    <div key={fav.id} className="flex items-center justify-between group">
                      <button
                        onClick={() => {
                          navigateToPath(fav.path)
                          // Need to push to router as well for it to work across other pages like /marketplace, /logs, etc
                          router.push(`/workspace/?path=${fav.path.join('/')}`)
                          closeSidebar()
                        }}
                        className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <FolderHeart className="h-4 w-4" />
                        <span className="truncate">{fav.name}</span>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
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
      <div className="p-4 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full">
            <div className="flex items-center gap-3 hover:bg-accent hover:text-accent-foreground rounded-md p-2 transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                U
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">User Name</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={closeSidebar}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={closeSidebar}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={closeSidebar}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

