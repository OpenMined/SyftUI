"use client"

import { Gauge } from "lucide-react"
import { Toolbar } from "@/components/ui/toolbar"
import { PingStatusCard } from "@/components/diagnostic/ping-status-card"

export default function DiagnosticPage() {
    return (
        <div className="flex flex-col h-full">
            <Toolbar
                title="Diagnostic"
                icon={<Gauge className="h-5 w-5" />}
            />
            <div className="p-6 space-y-6 overflow-auto">
                <PingStatusCard
                    serverName="cache server"
                    serverAddress="https://syftbox.openmined.org/"
                    className="w-full"
                />

                {/* Add more diagnostic cards here as needed */}
            </div>
        </div>
    )
}