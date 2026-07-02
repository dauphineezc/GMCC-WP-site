import {
  getCenterAnnouncement,
  getGlobalAnnouncement,
} from "@/lib/wordpress/announcements";
import { AnnouncementBarClient } from "./announcementBarClient";

export async function GlobalAnnouncementBar() {
  const announcement = await getGlobalAnnouncement();
  if (!announcement) return null;
  return <AnnouncementBarClient announcement={announcement} />;
}

export async function CenterAnnouncementBar({ centerSlug }: { centerSlug: string }) {
  const announcement = await getCenterAnnouncement(centerSlug);
  if (!announcement) return null;
  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-[100vw] overflow-x-clip -mt-px">
      <AnnouncementBarClient announcement={announcement} variant="center" />
    </div>
  );
}
