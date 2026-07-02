"use client";

import Link from "next/link";
import PhoneLink from "@/components/phoneLink";
import type { Announcement } from "@/lib/wordpress/announcements";

export function AnnouncementBarClient({
  announcement,
  variant = "global",
}: {
  announcement: Announcement;
  variant?: "global" | "center";
}) {
  return (
    <div
      className={`announcement-bar${variant === "center" ? " announcement-bar--center" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="announcement-bar__inner">
        <strong className="announcement-bar__primary">{announcement.primaryText}</strong>

        {announcement.secondaryText ? (
          <span className="announcement-bar__secondary">{announcement.secondaryText}</span>
        ) : null}

        {announcement.linkUrl ? (
          <Link href={announcement.linkUrl} className="announcement-bar__link">
            {announcement.linkLabel || "Learn more"}
          </Link>
        ) : null}

        {announcement.contactStatement || announcement.contactPhone ? (
          <div className="announcement-bar__contact-row">
            {announcement.contactStatement ? (
              <span className="announcement-bar__contact">{announcement.contactStatement}</span>
            ) : null}

            {announcement.contactPhone ? (
              <PhoneLink
                phone={announcement.contactPhone}
                className="announcement-bar__contact underline hover:text-neutral-500 hover:underline"
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
