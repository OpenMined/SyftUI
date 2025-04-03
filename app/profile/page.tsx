import Profile from "@/components/profile/profile";
import { Toolbar } from "@/components/ui/toolbar";
import { User } from "lucide-react";

export default function ProfilePage() {
    return (
        <div className="flex flex-col h-full">
            <Toolbar
                title="Profile"
                icon={<User className="h-5 w-5" />}
            />
            <main className="container mx-auto py-10 px-4 md:px-6 h-full w-full overflow-auto max-w-full">
                <Profile />
            </main>
        </div>
    )
}