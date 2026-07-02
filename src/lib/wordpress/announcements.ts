import { cache } from "react";
import { acfCtaHref, wpFetch } from "@/lib/wp";

export type Announcement = {
  id: string;
  displayScope: "global" | "center";
  centerSlug: string | null;
  primaryText: string;
  secondaryText: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  contactStatement: string | null;
  contactPhone: string | null;
};

type WpAnnouncementBarFields = {
  displayScope?: unknown;
  center?: unknown;
  activation?: boolean | null;
  primaryText?: string | null;
  secondaryText?: string | null;
  linkLabel?: string | null;
  link?: unknown;
  contactStatement?: string | null;
  contactPhone?: string | null;
};

type WpAnnouncementBarNode = {
  id?: string | null;
  databaseId?: number | null;
  announcementBarFields?: WpAnnouncementBarFields | null;
};

const ANNOUNCEMENTS_QUERY = /* GraphQL */ `
  query ActiveAnnouncementBars($first: Int!) {
    announcementBars(first: $first, where: { stati: PUBLISH }) {
      nodes {
        id
        databaseId
        announcementBarFields {
          displayScope
          center
          activation
          primaryText
          secondaryText
          linkLabel
          link
          contactStatement
          contactPhone
        }
      }
    }
  }
`;

const CENTER_OPTION_TO_SLUG: Record<string, string> = {
  "community center": "community-center",
  "tennis center": "tennis-center",
  "coleman family center": "coleman-family-center",
  "north family center": "north-family-center",
  "curling center": "curling-center",
};

function acfSelectValue(value: unknown): string {
  if (Array.isArray(value)) {
    return (value[0] ?? "").toString().trim();
  }
  return (value ?? "").toString().trim();
}

function normalizeCenterSlug(value: unknown): string | null {
  const raw = acfSelectValue(value);
  if (!raw) return null;

  const normalized = raw.toLowerCase();
  if (CENTER_OPTION_TO_SLUG[normalized]) {
    return CENTER_OPTION_TO_SLUG[normalized];
  }

  if (normalized.includes("-")) {
    return normalized;
  }

  return normalized.replace(/\s+/g, "-");
}

function parseDisplayScope(value: unknown): Announcement["displayScope"] | null {
  const normalized = acfSelectValue(value).toLowerCase();

  if (normalized === "global") {
    return "global";
  }

  if (
    normalized === "center" ||
    normalized === "specific center" ||
    normalized === "specific_center" ||
    normalized === "specific-center"
  ) {
    return "center";
  }

  return null;
}

function isActive(fields: WpAnnouncementBarFields | null | undefined): boolean {
  return fields?.activation === true;
}

function mapAnnouncementNode(node: WpAnnouncementBarNode): Announcement | null {
  const fields = node.announcementBarFields;
  if (!isActive(fields)) return null;

  const displayScope = parseDisplayScope(fields?.displayScope);
  const primaryText = (fields?.primaryText ?? "").trim();
  if (!displayScope || !primaryText) return null;

  const centerSlug =
    displayScope === "center" ? normalizeCenterSlug(fields?.center) : null;
  if (displayScope === "center" && !centerSlug) return null;

  const linkUrl = acfCtaHref(fields?.link) || null;
  const linkLabel = (fields?.linkLabel ?? "").trim() || null;
  const secondaryText = (fields?.secondaryText ?? "").trim() || null;
  const contactStatement = (fields?.contactStatement ?? "").trim() || null;
  const contactPhone = (fields?.contactPhone ?? "").trim() || null;

  return {
    id: node.id ?? String(node.databaseId ?? primaryText),
    displayScope,
    centerSlug,
    primaryText,
    secondaryText,
    linkUrl,
    linkLabel,
    contactStatement,
    contactPhone,
  };
}

export const getActiveAnnouncements = cache(async (): Promise<Announcement[]> => {
  try {
    const data = await wpFetch<{
      announcementBars?: { nodes?: WpAnnouncementBarNode[] | null } | null;
    }>(ANNOUNCEMENTS_QUERY, { first: 50 }, { suppressGraphQLErrorLogging: true });

    return (data?.announcementBars?.nodes ?? [])
      .map(mapAnnouncementNode)
      .filter((item): item is Announcement => item != null);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[announcements] Failed to load announcement bars:", error);
    }
    return [];
  }
});

export async function getGlobalAnnouncement(): Promise<Announcement | null> {
  const announcements = await getActiveAnnouncements();
  return announcements.find((item) => item.displayScope === "global") ?? null;
}

export async function getCenterAnnouncement(
  centerSlug: string,
): Promise<Announcement | null> {
  const normalizedSlug = normalizeCenterSlug(centerSlug);
  if (!normalizedSlug) return null;

  const announcements = await getActiveAnnouncements();
  return (
    announcements.find(
      (item) =>
        item.displayScope === "center" && item.centerSlug === normalizedSlug,
    ) ?? null
  );
}
