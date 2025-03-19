"use client"

import { useState, useEffect } from "react"
import { useFileSystem } from "@/components/file-system-context"
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
  LogOut,
  Settings,
  User,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
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
  const { navigateTo } = useFileSystem()
  const [favorites, setFavorites] = useState<{ id: string; name: string; path: string[] }[]>([])
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    favorites: true,
  })
  const router = useRouter()
  const pathname = usePathname()

  // User email for "My datasite" path
  const userEmail = "user@example.com"

  const getActiveItem = (pathname: string) => {
    if (pathname.startsWith("/marketplace")) return "Marketplace"
    if (pathname.startsWith("/logs")) return "Logs"
    if (pathname.startsWith("/workspace")) {
      const segments = pathname.split("/")
      if (segments.length >= 3) {
        if (segments[2] === "datasites") {
          return segments[3] === userEmail ? "My datasite" : "Datasites"
        }
      }
      return "Workspace"
    }
    return "Dashboard"
  }

  const [activeItem, setActiveItem] = useState(getActiveItem(pathname))

  // Update activeItem when pathname changes
  useEffect(() => {
    setActiveItem(getActiveItem(pathname))
  }, [pathname])

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const mainNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", action: () => setActiveItem("Dashboard") },
    {
      icon: Briefcase,
      label: "Workspace",
      action: () => {
        setActiveItem("Workspace")
        navigateTo([])
        router.push("/workspace")
      },
    },
    {
      icon: Database,
      label: "Datasites",
      action: () => {
        setActiveItem("Datasites")
        navigateTo(["datasites"])
        router.push("/workspace")
      },
    },
    {
      icon: FolderHeart,
      label: "My datasite",
      action: () => {
        setActiveItem("My datasite")
        navigateTo(["datasites", userEmail])
        router.push("/workspace")
      }
    },
    { icon: AppWindow, label: "Apps", action: () => setActiveItem("Apps") },
    {
      icon: ShoppingBag,
      label: "Marketplace",
      action: () => {
        setActiveItem("Marketplace")
        router.push("/marketplace")
      },
    },
    {
      icon: ScrollText,
      label: "Logs",
      action: () => {
        setActiveItem("Logs")
        router.push("/logs")
      }
    },
    { icon: Gauge, label: "Diagnostic", action: () => setActiveItem("Diagnostic") },
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
            setFavorites((prev) => [
              ...prev,
              {
                id: item.id,
                name: item.name,
                path: [...item.path],
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
    e.stopPropagation()
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
        <Image src={isDarkTheme ? "/logo-dark.svg" : "/logo-light.svg"} width={180} height={54} alt="SyftBox UI" />
        <Button variant="ghost" size="icon" className="md:hidden" onClick={closeSidebar}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex justify-between items-center mx-4 py-4 border-b border-border">
        <ConnectionStatus status={connectionStatus} />
      </div>
      <nav className="flex-1 overflow-auto p-2">
        <ul className="space-y-1 mb-4">
          {mainNavItems.map((item, index) => (
            <li key={index}>
              <Button
                variant="ghost"
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

        <div className="space-y-4">
          <Collapsible
            open={openSections.favorites}
            onOpenChange={() => toggleSection("favorites")}
            className="space-y-2"
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full flex items-center gap-2 px-3 py-2 justify-start font-normal"
              >
                <Star className="h-4 w-4 mr-2" />
                <span>Favorites</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pl-4 pr-2 py-2 space-y-1" onDrop={handleDrop} onDragOver={handleDragOver}>
                {favorites.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-3 py-2">Drag folders here to add to favorites</p>
                ) : (
                  favorites.map((fav) => (
                    <div key={fav.id} className="flex items-center justify-between group">
                      <div className="flex-1 flex gap-2">
                        <Button
                          variant="ghost"
                          className="flex-1 flex items-center gap-2 justify-start font-normal"
                          onClick={() => {
                            navigateTo(fav.path)
                            router.push("/workspace")
                          }}
                        >
                          <FolderHeart className="h-4 w-4" />
                          <span className="truncate">{fav.name}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          onClick={(e) => removeFavorite(fav.id, e)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
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
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                U
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">User Name</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

