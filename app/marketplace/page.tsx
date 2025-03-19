"use client"

import { useState } from "react"
import { Marketplace } from "@/components/marketplace"
import { MarketplaceAppDetail } from "@/components/marketplace-app-detail"

export default function MarketplacePage() {
    const [selectedApp, setSelectedApp] = useState<string | null>(null)

    return (
        <>
            {selectedApp ? (
                <MarketplaceAppDetail appId={selectedApp} onBack={() => setSelectedApp(null)} />
            ) : (
                <Marketplace onSelectApp={(appId) => setSelectedApp(appId)} />
            )}
        </>
    )
}