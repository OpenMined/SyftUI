import { Settings } from "@/components/settings";
import { Toolbar } from "@/components/ui/toolbar";
import { SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex h-full flex-col">
      <Toolbar title="Settings" icon={<SettingsIcon className="h-5 w-5" />} />
      <main className="container mx-auto h-full w-full max-w-full overflow-auto px-4 py-10 md:px-6">
        <Settings />
      </main>
    </div>
  );
}
