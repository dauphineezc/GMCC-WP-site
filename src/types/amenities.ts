export type AmenityDisplay = {
    name: string;
    slug: string;
    description?: string | null;
    relevantLink?: string | null;
    linkLabel?: string | null;
    image: {
      sourceUrl: string;
      altText: string | null;
    };
    /** Present on aggregated views (e.g. accessibility) to show which centers offer this amenity */
    centers?: Array<{ slug: string; title: string }>;
  };
  