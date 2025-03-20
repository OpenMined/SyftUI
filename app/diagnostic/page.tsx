"use client"

import { Toolbar } from "@/components/ui/toolbar"
import { Gauge } from "lucide-react"

export default function AppsPage() {
    return (
        <>
            <Toolbar
                title="Diagnostic"
                icon={<Gauge className="h-5 w-5" />}
            />
            <div className="flex flex-col justify-center h-full text-center">Diagnostic will appear here...</div>
        </>
    )
}