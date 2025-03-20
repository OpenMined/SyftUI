"use client"
import { Toolbar } from "@/components/ui/toolbar"
import { AppWindow } from "lucide-react"

export default function AppsPage() {
    return (
        <>
            <Toolbar
                title="Apps"
                icon={<AppWindow className="h-5 w-5" />}
            />
            <div className="flex flex-col justify-center h-full text-center">Installed apps will appear here...</div>
        </>
    )
}