"use client"

import { useEffect, useState, useRef } from "react"
import { ScrollText, Download, Trash2, Pause, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Log {
    timestamp: string
    level: "info" | "warning" | "error"
    message: string
}

export function Logs() {
    const [logs, setLogs] = useState<Log[]>([])
    const [isPaused, setIsPaused] = useState(false)
    const [isAutoScroll, setIsAutoScroll] = useState(true)
    const logsEndRef = useRef<HTMLDivElement>(null)

    // Mock data generation
    useEffect(() => {
        if (isPaused) return

        const levels: Log["level"][] = ["info", "warning", "error"]
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
            const level = levels[Math.floor(Math.random() * levels.length)]
            const message = messages[Math.floor(Math.random() * messages.length)]

            setLogs((prevLogs) => [...prevLogs, { timestamp, level, message }])
        }, 1000)

        return () => clearInterval(interval)
    }, [isPaused])

    // Auto-scroll effect
    useEffect(() => {
        if (isAutoScroll && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [logs, isAutoScroll])

    const handleClear = () => {
        setLogs([])
    }

    const handleDownload = () => {
        const logText = logs
            .map((log) => `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`)
            .join("\n")

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

    return (
        <div className="flex flex-col h-full p-4 gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ScrollText className="h-5 w-5" />
                    <h1 className="text-2xl font-semibold">System Logs</h1>
                </div>
                <div className="flex items-center gap-2">
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
                </div>
            </div>

            <Card className="flex-1 overflow-hidden">
                <div className="h-full overflow-auto p-4 font-mono text-sm">
                    {logs.map((log, index) => (
                        <div
                            key={index}
                            className={cn(
                                "py-1",
                                log.level === "error" && "text-red-500",
                                log.level === "warning" && "text-yellow-500",
                                log.level === "info" && "text-blue-500"
                            )}
                        >
                            <span className="text-muted-foreground">[{log.timestamp}]</span>{" "}
                            <span className="font-semibold">{log.level.toUpperCase()}:</span> {log.message}
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            </Card>
        </div>
    )
} 