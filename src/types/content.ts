export type ImageAsset = { url: string; alt: string; caption?: string; width?: number; height?: number };

export type Taxonomies = {
  audience?: string[];
  programArea?: string[];
  center?: string[];
  season?: string[];         // e.g., ["Fall I"]
  year?: number[];           // e.g., [2025]
  eventType?: "Tournament" | "Fundraiser" | "Seminar" | "Social";
  registrationSystem?: "rectrac" | "external" | "none";
};

export type SEO = {
  title?: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: ImageAsset;
  robots?: "index,follow" | "noindex,follow" | "index,nofollow" | "noindex,nofollow";
};

export type Governance = {
  owner: string;
  author?: string;
  editor?: string;
  publisher?: string;
  status: "Draft" | "In Review" | "Published" | "Archived";
  reviewDate: string;        // ISO date
  contentCategory: "Core" | "Supporting" | "System";
  notes?: string;
};

export type ExternalSchedule = {
  system?: "rectrac" | "external";
  activityCode?: string;
  sectionCodes?: string[];
  deepLink?: string;
  nextStartDate?: string;    // ISO date
};

// --- Program ---
export type Program = {
  type: "program";
  version: string;
  id: string;
  slug: string;
  title: string;
  summary: string;
  heroImage: ImageAsset;
  descriptionHtml?: string;
  offeringType: "class" | "camp" | "clinic" | "league" | "trip" | "workshop" | "dropin" | "Race" | "Workshop" | "League" | "Class" | "Clinic" | "Camp" | "Trip"; // tolerate WP casing
  ageRange?: { min: number; max: number };
  skillLevel?: "Beginner" | "Intermediate" | "Advanced" | "All Levels";
  duration?: string;
  priceFrom?: number;
  benefits?: string[];
  whatToBring?: string[];
  instructors?: string[];    // e.g., "/staff/sam-lee"
  taxonomies: Taxonomies;
  externalSchedule?: ExternalSchedule;
  mediaGallery?: ImageAsset[];
  attachments?: { label: string; url: string; fileType?: string }[];
  relatedPrograms?: string[];
  seo?: SEO;
  governance: Governance;
  canonicalUrl?: string;
  vanityPaths?: string[];
};

// --- Event ---
export type Event = {
  type: "event";
  version: string;
  id: string;
  slug: string;
  title: string;
  summary?: string;
  heroImage?: ImageAsset;
  descriptionHtml?: string;
  start: string;             // ISO datetime
  end: string;               // ISO datetime
  locationName?: string;
  addressOverride?: string;
  cost?: string;
  registrationLink?: string;
  taxonomies: Taxonomies;
  contact?: string;          // "/staff/slug"
  seo?: SEO;
  governance: Governance;
  canonicalUrl?: string;
};
