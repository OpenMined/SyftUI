"use client"

import { useEffect, useState, useRef } from "react"
import { ScrollText, Download, Trash2, Pause, Play, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Toolbar } from "@/components/ui/toolbar"
import { mockApps } from "@/lib/mock-apps"
import { mockLogs } from "@/lib/mock-logs"
import { cn } from "@/lib/utils"

interface Log {
    timestamp: string
    app: string
    level: "debug" | "info" | "warning" | "error"
    message: string
}

export function Logs() {
    const [logs, setLogs] = useState<Array<Log>>(mockLogs)
    const [isPaused, setIsPaused] = useState(false)
    const [filter, setFilter] = useState("")
    const [filterApp, setFilterApp] = useState<string | null>(null)
    const [filterLevel, setFilterLevel] = useState<string | null>(null)
    const [isAutoScroll, setIsAutoScroll] = useState(true)
    const installedApps = [{ id: "system", name: "System" }, ...mockApps.filter(app => app.installed)];
    const levels: Log["level"][] = ["debug", "info", "warn", "error"]
    const scrollAreaRef = useRef<HTMLDivElement>(null)

    // Mock log stream generation
    useEffect(() => {
        if (isPaused) return

        const messages = [
            "Initializing system components...",
            "Loading configuration files...",
            "Establishing database connection...",
            "Processing data request...",
            "Updating cache...",
            "Synchronizing with remote server...",
            "Validating input parameters...",
            "Generating report...",
            "Cleaning up temporary files...",
            "Backing up data...",
        ]

        const interval = setInterval(() => {
            const timestamp = new Date().toISOString()
            const app = installedApps[Math.floor(Math.random() * installedApps.length)].name
            const level = levels[Math.floor(Math.random() * levels.length)]
            const message = messages[Math.floor(Math.random() * messages.length)]

            setLogs((prevLogs) => [...prevLogs, { timestamp, app, level, message }])
        }, 1000)

        return () => clearInterval(interval)
    }, [isPaused])

    // Auto-scroll effect
    useEffect(() => {
        if (isAutoScroll && scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight
            }
        }
    }, [logs, isAutoScroll])

    // set isAutoScroll to false when user scrolls up, and true when user scrolls to the bottom
    useEffect(() => {
        const scrollContainer = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]")
        if (!scrollContainer) return

        const handleScroll = () => {
            const isAtBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop === scrollContainer.clientHeight
            setIsAutoScroll(isAtBottom)
        }

        scrollContainer.addEventListener("scroll", handleScroll)
        return () => scrollContainer.removeEventListener("scroll", handleScroll)
    }, [])

    const filteredLogs = logs.filter((log) => {
        const matchesText = filter ? log.message.toLowerCase().includes(filter.toLowerCase()) : true
        const matchesApp = filterApp ? log.app === filterApp : true
        const matchesLevel = filterLevel ? log.level === filterLevel : true
        return matchesText && matchesApp && matchesLevel
    })

    const handleClear = () => {
        setLogs([])
    }

    const handleDownload = () => {
        const logText = logs.map((log) => `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`).join("\n")
        const blob = new Blob([logText], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `logs-${new Date().toISOString()}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const getLevelColor = (level: string) => {
        switch (level) {
            case "debug":
                return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 hover:text-gray-900 hover:border-gray-300"
            case "info":
                return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 hover:text-blue-900 hover:border-blue-300"
            case "warn":
                return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 hover:text-yellow-900 hover:border-yellow-300"
            case "error":
                return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200 hover:text-red-900 hover:border-red-300"
            default:
                return "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    return (
        <div className="flex flex-col h-full">
            <Toolbar
                title="System Logs"
                icon={<ScrollText className="h-5 w-5" />}
            >
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Filter logs..."
                        className="pl-9"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsPaused(!isPaused)}
                    title={isPaused ? "Resume" : "Pause"}
                >
                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" onClick={handleClear} title="Clear Logs">
                    <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleDownload} title="Download Logs">
                    <Download className="h-4 w-4" />
                </Button>
            </Toolbar>

            <div className="flex gap-2 p-2 border-b overflow-x-auto">
                {levels.map((level) => (
                    <Badge
                        key={level}
                        className={cn(
                            "cursor-pointer select-none",
                            getLevelColor(level),
                            filterLevel !== null && filterLevel !== level && "brightness-125 dark:brightness-[20%]"
                        )}
                        onClick={() => setFilterLevel(filterLevel === level ? null : level)}
                    >
                        {level.toUpperCase()}
                    </Badge>
                ))}
                <div className="flex items-start ml-2">
                    <Select
                        value={filterApp || "all"}
                        onValueChange={(value) => setFilterApp(value === "all" ? null : value)}
                    >
                        <SelectTrigger className="h-8 select-none">
                            <SelectValue placeholder="All apps" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All apps</SelectItem>
                            {installedApps.map((app) => (
                                <SelectItem key={app.id} value={app.name}>
                                    {app.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <ScrollArea className="flex-1" ref={scrollAreaRef}>
                <div className="p-4 font-mono text-sm">
                    {filteredLogs.length === 0 ? (
                        <div className="flex items-center justify-center h-40 text-muted-foreground">
                            No logs to display
                        </div>
                    ) : (
                        <table className="table-auto border-separate border-spacing-1 text-start">
                            <tbody>
                                {filteredLogs.map((log, index) => (
                                    <tr key={index}>
                                        <td className="text-muted-foreground align-baseline text-nowrap">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </td>
                                        <td className="w-16 text-end align-baseline">
                                            <Badge
                                                className={cn("cursor-pointer select-none", getLevelColor(log.level))}
                                                onClick={() => setFilterLevel(filterLevel === log.level ? null : log.level)}
                                            >
                                                {log.level.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td className="align-baseline">
                                            <Badge
                                                className="cursor-pointer select-none text-nowrap bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 hover:text-purple-900 hover:border-purple-300"
                                                onClick={() => setFilterApp(filterApp === log.app ? null : log.app)}
                                            >
                                                {log.app.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td className="whitespace-pre align-baseline text-wrap">
                                            {log.message}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </ScrollArea >
        </div >
    )
}