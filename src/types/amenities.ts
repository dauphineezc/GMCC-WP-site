export type AmenityDisplay = {
    name: string;
    slug: string;
    description?: string | null;
    image: {
      sourceUrl: string;
      altText: string | null;
    };
  };
  