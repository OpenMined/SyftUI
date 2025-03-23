"use client"

import { Gauge, Bug } from "lucide-react"
import { Toolbar } from "@/components/ui/toolbar"
import { PingStatusCard } from "@/components/diagnostic/ping-status-card"
import { BugReportDialog } from "@/components/diagnostic/bug-report-dialog"
import { Button } from "@/components/ui/button"

export default function DiagnosticPage() {
    return (
        <div className="flex flex-col h-full">
            <Toolbar
                title="Diagnostic"
                icon={<Gauge className="h-5 w-5" />}
                rightSection={
                    <BugReportDialog trigger={
                        <Button variant="outline" size="sm">
                            <Bug className="h-4 w-4" />
                            Report Bug
                        </Button>
                    } />
                }
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