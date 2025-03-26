import { getAssetPath } from "@/lib/utils"

export function LogoComponent() {
    return (
        <>
            <img src={getAssetPath("/logo-light.svg")} alt="SyftBox Logo" className="h-full w-auto dark:hidden" />
            <img src={getAssetPath("/logo-dark.svg")} alt="SyftBox Logo" className="hidden h-full w-auto dark:block" />
        </>
    )
