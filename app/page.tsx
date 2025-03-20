"use client"

import { Toolbar } from "@/components/ui/toolbar"
import { LayoutDashboard } from "lucide-react"

export default function HomePage() {
  return (
    <>
      <Toolbar
        title="Dashboard"
        icon={<LayoutDashboard className="h-5 w-5" />}
      />
      <div className="flex flex-col justify-center h-full text-center">Dashboard will appear here...</div>
    </>
  )
}
