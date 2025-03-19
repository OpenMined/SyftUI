"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationBell } from "@/components/notification-bell"

interface ToolbarProps {
    title?: string | React.ReactNode
    icon?: React.ReactNode
    children?: React.ReactNode
    className?: string
    onToggleSidebar?: () => void
}

export function Toolbar({ title, icon, children, className, onToggleSidebar }: ToolbarProps) {
    return (
        <div className={cn("flex items-center justify-between p-4 border-b", className)}>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={onToggleSidebar}>
                    <Menu className="h-5 w-5" />
                </Button>
                {icon && icon}
                {title && <h1 className="text-xl font-medium">{title}</h1>}
            </div>

            <div className="flex items-center gap-2">
                {children}
                <NotificationBell />
                <ThemeToggle />
            </div>
        </div>
    )
}
