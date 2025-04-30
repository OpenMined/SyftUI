import Profile from "@/components/profile/profile";
import { AnnouncementBar } from "@/components/ui/announcement-bar";
import { Toolbar } from "@/components/ui/toolbar";
import { User } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="flex h-full flex-col">
      <AnnouncementBar variant="warning">
        This is a mocked version of the profile page. The real version with full
        functionality is coming soon.
      </AnnouncementBar>
      <Toolbar title="Profile" icon={<User className="h-5 w-5" />} />
      <main className="container mx-auto h-full w-full max-w-full overflow-auto px-4 py-10 md:px-6">
        <Profile />
      </main>
    </div>
  );
}
