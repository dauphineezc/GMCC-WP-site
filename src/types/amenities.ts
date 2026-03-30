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
  };
  