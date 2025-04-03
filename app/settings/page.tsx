import { Settings } from "@/components/settings";
import { Toolbar } from "@/components/ui/toolbar";
import { SettingsIcon } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="flex flex-col h-full">
            <Toolbar
                title="Settings"
                icon={<SettingsIcon className="h-5 w-5" />}
            />
            <main className="container mx-auto py-10 px-4 md:px-6 h-full w-full overflow-auto max-w-full">
                <Settings />
            </main>
        </div>
    )
}