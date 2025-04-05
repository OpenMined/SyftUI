import Profile from "@/components/profile/profile";
import { Toolbar } from "@/components/ui/toolbar";
import { User } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="flex h-full flex-col">
      <Toolbar title="Profile" icon={<User className="h-5 w-5" />} />
      <main className="container mx-auto h-full w-full max-w-full overflow-auto px-4 py-10 md:px-6">
        <Profile />
      </main>
    </div>
  );
}
