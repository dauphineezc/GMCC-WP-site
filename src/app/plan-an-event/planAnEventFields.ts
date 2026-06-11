// WPGraphQL data shapes for the Plan an Event page, shared between
// page.tsx (server fetch) and planAnEventClient.tsx (rendering). Kept out of
// page.tsx so the route file only exports what Next.js expects.

type WPImageNode = {
  sourceUrl?: string | null;
  altText?: string | null;
};

export type MaybeImage = { node?: WPImageNode | null } | null;

export type SectionCard = {
  sectionHeader?: string | null;
  sectionDescription?: string | null;
  sectionImage?: MaybeImage;
  buttonLabel?: string | null;
} | null;

type CenterRef = { title?: string | null; slug?: string | null };

export type RoomData = {
  title?: string | null;
  slug?: string | null;
  rentableRoomFields?: {
    name?: string | null;
    description?: string | null;
    center?: { nodes?: CenterRef[] | null } | null;
    capacity?: string | null;
    price?: string | null;
    roomAmenities?: string[] | string | null;
    gallery?: unknown;
  } | null;
};

export type PartyPackageData = {
  title?: string | null;
  slug?: string | null;
  featuredImage?: MaybeImage;
  partyPackageFields?: {
    name?: string | null;
    photo?: MaybeImage;
    description?: string | null;
    price?: string | null;
    center?: { nodes?: CenterRef[] | null } | null;
    partyType?: string | string[] | null;
  } | null;
};

export type PlanAnEventFields = {
  section1Card?: SectionCard;
  section2Card?: SectionCard;
  section3Card?: SectionCard;
  roomRentalResultsHeader?: string | null;
  roomRentalResultsBody?: string | null;
  birthdayPackagesBody?: string | null;
  allPackagesInclude?: string | null;
  sportsPackagesBody?: string | null;
  locationOfferingsHeader?: string | null;
  locationOfferingsBody?: string | null;
  offeringsByCenter?: {
    communityCenterOfferings?: string | null;
    tennisCenterOfferings?: string | null;
    curlingCenterOfferings?: string | null;
    colemanFamilyCenterOfferings?: string | null;
    northFamilyCenterOfferings?: string | null;
  } | null;
  centerLogos?: {
    communityCenterLogo?: MaybeImage;
    tennisCenterLogo?: MaybeImage;
    curlingCenterLogo?: MaybeImage;
    colemanFamilyCenterLogo?: MaybeImage;
    northFamilyCenterLogo?: MaybeImage;
  } | null;
  faqs?: {
    faq1?: { question?: string | null; answer?: string | null } | null;
    faq2?: { question?: string | null; answer?: string | null } | null;
    faq3?: { question?: string | null; answer?: string | null } | null;
  } | null;
  contactHeader?: string | null;
  contactSubheader?: string | null;
};
