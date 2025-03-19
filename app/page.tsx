"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to workspace page by default
    router.push("/workspace")
  }, [router])

  return null
}

