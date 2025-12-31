// src/app/centers/[slug]/page.tsx
import { wpFetch } from "@/lib/wp";
import CenterTabs from "./centerTabs";
import ImageCarousel from "../../../components/imageCarousel";
import AmenitiesCarousel from "../../../components/amenitiesCarousel";

const AMENITY_BY_SLUG_QUERY = `
  query AmenityBySlug($slug: ID!) {
    amenity(id: $slug, idType: SLUG) {
      name
      slug
      amenityImages {
        amenityImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`;

const ACCESSIBILITY_AMENITY_BY_SLUG_QUERY = `
  query AccessibilityAmenityBySlug($slug: ID!) {
    accessibilityAmenity(id: $slug, idType: SLUG) {
      name
      slug
      description
      amenityImages {
        amenityImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`;

const CENTER_BY_SLUG_QUERY = `
  query CenterBySlug($slug: ID!) {
    center(id: $slug, idType: SLUG) {
      title
      slug
      featuredImage {
        node {
          sourceUrl
          altText
          mediaDetails { width height }
        }
      }
      centersFields {
        summary
        longDescription

        centerType
        address
        socialLinks

        amenities {
          nodes {
            name
            slug
          }
        }

        accessibilityAmenities {
          nodes {
            name
            slug
          }
        }

        hours {
          mondayHours {
            closedMonday
            mondayOpenTime
            mondayCloseTime
          }
          tuesdayHours {
            closedTuesday
            tuesdayOpenTime
            tuesdayCloseTime
          }
          wednesdayHours {
            closedWednesday
            wednesdayOpenTime
            wednesdayCloseTime
          }
          thursdayHours {
            closedThursday
            thursdayOpenTime
            thursdayCloseTime
          }
          fridayHours {
            closedFriday
            fridayOpenTime
            fridayCloseTime
          }
          saturdayHours {
            closedSaturday
            saturdayOpenTime
            saturdayCloseTime
          }
          sundayHours {
            closedSunday
            sundayOpenTime
            sundayCloseTime
          }
        }

        contactInfo {
          contactPhone
          contactEmail
        }

        imagesforcarousel {
          image1 {
            image1Image {
              node {
                sourceUrl
                altText
              }
            }
            image1Cta
            image1Url
          }
          image2 {
            image2Image {
              node {
                sourceUrl
                altText
              }
            }
            image2Cta
            image2Url
          }
          image3 {
            image3Image {
              node {
                sourceUrl
                altText
              }
            }
            image3Cta
            image3Url
          }
        }

        featuredPrograms {
          nodes {
            ... on Program {
              slug
              title
              featuredImage {
                node {
                  sourceUrl
                  altText
                }
              }
              programFields {
                summary
                offeringType
              }
            }
          }
        }

        policiesFaqs {
          nodes {
            ... on Policy {
              slug
              title
            }
          }
        }

        announcements {
          nodes {
            ... on News {
              slug
              title
            }
          }
        }
      }
    }

    testimonials(first: 100) {
      nodes {
        slug
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        testimonialFields {
          quote
          personName
          personContext
          relatedCenters {
            nodes {
              ... on Center {
                slug
              }
            }
          }
        }
      }
    }

    memberships(first: 100) {
      nodes {
        title
        membershipFields {
          centers {
            nodes {
              ... on Center {
                slug
              }
            }
          }
        }
      }
    }
  }
`;

type CenterPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CenterPage(props: CenterPageProps) {
  const { slug } = await props.params;

  const data = await wpFetch<any>(CENTER_BY_SLUG_QUERY, { slug });
  const center = data?.center;

  if (!center) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        Center not found.
      </main>
    );
  }

  // NOTE: centersFields, not centerFields
  const f = center.centersFields ?? {};

  // Process carousel images
  const carouselGroup = f.imagesforcarousel ?? {};
  const carouselImages: Array<{
    image: { sourceUrl: string; altText: string | null } | null;
    cta: string | null;
    url: string | null;
  }> = [];

  // Extract images from image1, image2, etc.
  for (let i = 1; i <= 3; i++) {
    const imageGroup = carouselGroup[`image${i}` as keyof typeof carouselGroup];
    if (imageGroup) {
      const imageNode = imageGroup[`image${i}Image` as keyof typeof imageGroup] as any;
      const cta = imageGroup[`image${i}Cta` as keyof typeof imageGroup] as string | null;
      const url = imageGroup[`image${i}Url` as keyof typeof imageGroup] as string | null;
      
      if (imageNode?.node?.sourceUrl) {
        carouselImages.push({
          image: {
            sourceUrl: imageNode.node.sourceUrl,
            altText: imageNode.node.altText ?? null,
          },
          cta: cta ?? null,
          url: url ?? null,
        });
      }
    }
  }

  const amenityNodes = f.amenities?.nodes ?? [];
  const amenityNames =
    amenityNodes.map((n: any) => n?.name).filter(Boolean) ?? [];

  // Fetch amenity images for carousel
  const amenitySlugs = amenityNodes.map((n: any) => n?.slug).filter(Boolean);
  const amenityImagePromises = amenitySlugs.map((amenitySlug: string) =>
    wpFetch<any>(AMENITY_BY_SLUG_QUERY, { slug: amenitySlug })
  );
  const amenityResults = await Promise.all(amenityImagePromises);

  // Filter to only include amenities with images
  const amenitiesWithImages: Array<{
    name: string;
    slug: string;
    image: { sourceUrl: string; altText: string | null };
  }> = [];

  for (const result of amenityResults) {
    const amenity = result?.amenity;
    const imageNode = amenity?.amenityImages?.amenityImage?.node;
    if (amenity && imageNode?.sourceUrl) {
      amenitiesWithImages.push({
        name: amenity.name,
        slug: amenity.slug,
        image: {
          sourceUrl: imageNode.sourceUrl,
          altText: imageNode.altText ?? null,
        },
      });
    }
  }

  // Fetch accessibility amenity images for carousel
  const accessibilityAmenityNodes = f.accessibilityAmenities?.nodes ?? [];
  const accessibilityAmenitySlugs = accessibilityAmenityNodes.map((n: any) => n?.slug).filter(Boolean);
  const accessibilityAmenityImagePromises = accessibilityAmenitySlugs.map((amenitySlug: string) =>
    wpFetch<any>(ACCESSIBILITY_AMENITY_BY_SLUG_QUERY, { slug: amenitySlug })
  );
  const accessibilityAmenityResults = await Promise.all(accessibilityAmenityImagePromises);

  // Filter to only include accessibility amenities with images
  const accessibilityAmenitiesWithImages: Array<{
    name: string;
    slug: string;
    description?: string | null;
    image: { sourceUrl: string; altText: string | null };
  }> = [];

  for (const result of accessibilityAmenityResults) {
    const amenity = result?.accessibilityAmenity;
    const imageNode = amenity?.amenityImages?.amenityImage?.node;
    if (amenity && imageNode?.sourceUrl) {
      accessibilityAmenitiesWithImages.push({
        name: amenity.name,
        slug: amenity.slug,
        description: amenity.description ?? null,
        image: {
          sourceUrl: imageNode.sourceUrl,
          altText: imageNode.altText ?? null,
        },
      });
    }
  }

  const featuredPrograms = f.featuredPrograms?.nodes ?? [];
  const policies = f.policiesFaqs?.nodes ?? [];
  const announcements = f.announcements?.nodes ?? [];

  // Filter testimonials by center
  const allTestimonials = data?.testimonials?.nodes ?? [];
  const centerTestimonials = allTestimonials.filter((t: any) =>
    t.testimonialFields?.relatedCenters?.nodes?.some(
      (c: any) => c?.slug === slug
    )
  );

  // Filter memberships by center (just names)
  const allMemberships = data?.memberships?.nodes ?? [];
  const centerMemberships = allMemberships
    .filter((m: any) =>
      m.membershipFields?.centers?.nodes?.some(
        (c: any) => c?.slug === slug
      )
    )
    .map((m: any) => m.title)
    .filter(Boolean);

  const hours = f.hours ?? {};

  const days: {
    key: string; // label-based key for open/close names
    field: keyof typeof hours;
    label: string;
  }[] = [
    { key: "monday", field: "mondayHours", label: "Monday" },
    { key: "tuesday", field: "tuesdayHours", label: "Tuesday" },
    { key: "wednesday", field: "wednesdayHours", label: "Wednesday" },
    { key: "thursday", field: "thursdayHours", label: "Thursday" },
    { key: "friday", field: "fridayHours", label: "Friday" },
    { key: "saturday", field: "saturdayHours", label: "Saturday" },
    { key: "sunday", field: "sundayHours", label: "Sunday" },
  ];

  const renderDayHours = (opts: {
    dayKey: string;
    dayData: any;
    label: string;
  }) => {
    const { dayKey, dayData, label } = opts;
    if (!dayData) return null;

    // e.g. closedMonday, closedTuesday...
    const closed =
      dayData[`closed${label}` as keyof typeof dayData] ??
      dayData.closed ??
      false;

    if (closed) {
      return (
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">{label}</span>
          <span className="text-neutral-500">Closed</span>
        </div>
      );
    }

    const openTime =
      dayData[`${dayKey}OpenTime` as keyof typeof dayData] ??
      dayData.openTime;
    const closeTime =
      dayData[`${dayKey}CloseTime` as keyof typeof dayData] ??
      dayData.closeTime;

    if (!openTime || !closeTime) return null;

    return (
      <div className="flex justify-between text-sm">
        <span className="text-neutral-600">{label}</span>
        <span className="text-neutral-800">
          {openTime} – {closeTime}
        </span>
      </div>
    );
  };

  return (
    <main>
      {/* HERO IMAGE CAROUSEL - Full Width */}
      {carouselImages.length > 0 ? (
        <div className="w-full">
          <ImageCarousel images={carouselImages} />
        </div>
      ) : center.featuredImage?.node?.sourceUrl ? (
        // Fallback to featured image if no carousel images
        // eslint-disable-next-line @next/next/no-img-element
        <div className="w-full">
          <img
            src={center.featuredImage.node.sourceUrl}
            alt={center.featuredImage.node.altText ?? ""}
            className="h-72 w-full object-cover sm:h-96"
          />
        </div>
      ) : null}

      {/* Content Container */}
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        {/* HERO */}
        <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {center.title}
            </h1>
            {f.summary && (
              <p className="max-w-2xl text-sm text-neutral-600 sm:text-base">
                {f.summary}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 text-xs text-neutral-700">
            {f.centerType && (
              <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1">
                {f.centerType}
              </span>
            )}
                {amenityNames.length > 0 && (
                <span className="inline-flex flex-wrap justify-end gap-1">
                    {amenityNames.map((name: string) => (
                    <span
                        key={name}
                        className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-800"
                    >
                        {name}
                    </span>
                    ))}
                </span>     
                )}
          </div>
        </div>
      </section>

      {/* TABS */}
      <CenterTabs
        defaultTab="about"
        tabs={[
          {
            id: "about",
            label: "About",
            content: (
              <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
                {/* LEFT COLUMN */}
                <div className="space-y-8">
                  {/* Overview */}
                  {f.longDescription && (
                    <article className="prose prose-sm max-w-none sm:prose-base">
                      <p className="whitespace-pre-line">{f.longDescription}</p>
                    </article>
                  )}

                  {/* Amenities Carousel */}
                  {amenitiesWithImages.length > 0 && (
                    <AmenitiesCarousel amenities={amenitiesWithImages} title="Amenities" />
                  )}

                  {/* Accessibility Amenities Carousel */}
                  {accessibilityAmenitiesWithImages.length > 0 && (
                    <AmenitiesCarousel amenities={accessibilityAmenitiesWithImages} title="Accessibility Features" />
                  )}

                  {/* Policies & FAQs / Announcements */}
                  {(policies.length > 0 || announcements.length > 0) && (
                    <div className="grid gap-6 md:grid-cols-2">
                      {policies.length > 0 && (
                        <div>
                          <h2 className="text-lg font-medium">Policies & FAQs</h2>
                          <ul className="mt-2 space-y-1 text-sm text-neutral-700">
                            {policies.map((p: any, i: number) => (
                              <li key={p.slug ?? i}>
                                <a
                                  href={`/policies/${p.slug}`}
                                  className="text-blue-600 hover:underline"
                                >
                                  {p.title}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {announcements.length > 0 && (
                        <div>
                          <h2 className="text-lg font-medium">Announcements</h2>
                          <ul className="mt-2 space-y-1 text-sm text-neutral-700">
                            {announcements.map((n: any, i: number) => (
                              <li key={n.slug ?? i}>
                                <a
                                  href={`/news/${n.slug}`}
                                  className="text-blue-600 hover:underline"
                                >
                                  {n.title}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* RIGHT SIDEBAR */}
                <aside className="space-y-6">
                  {/* Address & Contact Card */}
                  {(f.address || f.contactInfo?.contactPhone || f.contactInfo?.contactEmail) && (
                    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-4">
                          {/* Address */}
                          {f.address && (
                            <div>
                              <h3 className="text-sm font-medium text-neutral-500 mb-1">Address</h3>
                              <p className="text-sm text-neutral-900 whitespace-pre-line">
                                {f.address}
                              </p>
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                              >
                                Get directions →
                              </a>
                            </div>
                          )}

                          {/* Contact */}
                          {(f.contactInfo?.contactPhone || f.contactInfo?.contactEmail) && (
                            <div>
                              <h3 className="text-sm font-medium text-neutral-500 mb-1">Contact</h3>
                              <div className="space-y-1 text-sm text-neutral-900">
                                {f.contactInfo?.contactPhone && (
                                  <div>
                                    <span className="text-neutral-500">Phone: </span>
                                    <a
                                      href={`tel:${f.contactInfo.contactPhone}`}
                                      className="text-blue-600 hover:underline"
                                    >
                                      {f.contactInfo.contactPhone}
                                    </a>
                                  </div>
                                )}
                                {f.contactInfo?.contactEmail && (
                                  <div>
                                    <span className="text-neutral-500">Email: </span>
                                    <a
                                      href={`mailto:${f.contactInfo.contactEmail}`}
                                      className="text-blue-600 hover:underline"
                                    >
                                      {f.contactInfo.contactEmail}
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Make Preferred Center Button */}
                        <button
                          type="button"
                          className="flex-shrink-0 p-2 text-neutral-400 hover:text-red-500 transition-colors"
                          aria-label="Make preferred center"
                          title="Make preferred center"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Hours card */}
                  <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                    <h2 className="text-base font-semibold text-neutral-900">
                      Hours
                    </h2>
                    <div className="mt-3 space-y-1">
                      {days.map(({ key, field, label }) => (
                        <div key={key}>
                          {renderDayHours({
                            dayKey: key,
                            dayData: (hours as any)[field] ?? null,
                            label,
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Social links */}
                  {f.socialLinks && (
                    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                      <h2 className="text-base font-semibold text-neutral-900">
                        Social
                      </h2>
                      <p className="mt-2 whitespace-pre-line text-sm text-neutral-700">
                        {f.socialLinks}
                      </p>
                    </div>
                  )}
                </aside>
              </div>
            ),
          },
          {
            id: "history",
            label: "History",
            content: f.history ? (
              <article className="prose prose-sm max-w-none sm:prose-base">
                <p className="whitespace-pre-line">{f.history}</p>
              </article>
            ) : (
              <p className="text-sm text-neutral-500">History information coming soon.</p>
            ),
          },
          {
            id: "visit",
            label: "Visit",
            content: f.schedule ? (
              <article className="prose prose-sm max-w-none sm:prose-base">
                <p className="whitespace-pre-line">{f.schedule}</p>
              </article>
            ) : (
              <div className="space-y-6">
                <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <h2 className="text-base font-semibold text-neutral-900 mb-3">
                    Hours
                  </h2>
                  <div className="space-y-1">
                    {days.map(({ key, field, label }) => (
                      <div key={key}>
                        {renderDayHours({
                          dayKey: key,
                          dayData: (hours as any)[field] ?? null,
                          label,
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="gmcc-schedule-embed">
                    <iframe
                      src="https://gmcc-drop-in-schedule.vercel.app/?type=dropin&sub=aquatics"
                      style={{ width: "100%", height: "1000px", border: "0", overflow: "visible" }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                  </div>
              </div>
            ),
          },
          {
            id: "programs",
            label: "Programs",
            content: featuredPrograms.length > 0 ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {featuredPrograms.map((prog: any) => (
                    <a
                      key={prog.slug}
                      href={`/programs/${prog.slug}`}
                      className="group rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm hover:border-emerald-500/70 hover:shadow-md transition"
                    >
                      <div className="flex gap-3">
                        {prog.featuredImage?.node?.sourceUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={prog.featuredImage.node.sourceUrl}
                            alt={prog.featuredImage.node.altText ?? ""}
                            className="h-16 w-16 flex-none rounded-lg object-cover"
                          />
                        )}
                        <div className="space-y-1">
                          <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-emerald-700">
                            {prog.title}
                          </h3>
                          {prog.programFields?.summary && (
                            <p className="line-clamp-2 text-xs text-neutral-600">
                              {prog.programFields.summary}
                            </p>
                          )}
                          {prog.programFields?.offeringType && (
                            <p className="text-[11px] text-neutral-500">
                              {prog.programFields.offeringType.join?.(", ") ??
                                prog.programFields.offeringType}
                            </p>
                          )}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
                <div className="text-center">
                  <a
                    href="/programs"
                    className="inline-block text-sm text-blue-600 hover:underline"
                  >
                    View all programs →
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">No programs available at this time.</p>
            ),
          },
          {
            id: "membership",
            label: "Membership",
            content: (
              <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                {/* MAIN CONTENT */}
                <div className="space-y-8">
                  {/* Hero/Pitch Section */}
                  {(f.membershipPitch || f.membershipBenefits) && (
                    <div className="space-y-4">
                      {f.membershipPitch && (
                        <article className="prose prose-sm max-w-none sm:prose-base">
                          <div className="whitespace-pre-line">{f.membershipPitch}</div>
                        </article>
                      )}
                      {f.membershipBenefits && (
                        <div>
                          <h2 className="text-lg font-semibold text-neutral-900 mb-3">
                            Membership Benefits
                          </h2>
                          <article className="prose prose-sm max-w-none sm:prose-base">
                            <div className="whitespace-pre-line">{f.membershipBenefits}</div>
                          </article>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Benefits */}
                  <h2 className="text-xl font-bold text-gmcc-navy mb-3">Facility</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h3 className="text-md font-semibold text-gmcc-navy">Get access to the Community Center's brand new facility, built with your comfort and convenience in mind:</h3>
                      <ul className="list-disc pl-5 text-base text-neutral-700">
                        <li>Double gymnasium</li>
                        <li>24/7 Fitness Center</li>
                        <li>Courts</li>
                        <li>Swimming Pools</li>
                        <li>Indoor Track</li>
                        <li>Fitness Studios</li>
                        <li>Family Activity Areas</li>
                        <li>Secure Childcare Rooms</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      {amenitiesWithImages.length > 0 && (
                        <AmenitiesCarousel amenities={amenitiesWithImages} title="" />
                      )}
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-gmcc-navy mb-3">For Families</h2>
                  <h3 className="text-md font-semibold text-gmcc-navy">Find fitness and entertainment for the whole family:</h3>
                  <div className="grid gap-4 md:grid-cols-[1fr_1.5fr] items-stretch">
                    <div className="flex flex-col gap-2">
                      <img src="/JungleGymPhoto.png" alt="Jungle Gym" className="w-full flex-1 object-cover rounded-md" />
                      <img src="/ChildCarePhoto.png" alt="Child Care" className="w-full flex-1 object-cover rounded-md" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-md font-semibold text-neutral-700">The Zone</h4>
                      <p className="text-sm text-neutral-700">A supervised hangout for kids ages 6–12, led by a certified K–12 teacher. Kids can get homework help, try STEM projects, play games, or enjoy 
                        the Nintendo Switch and Nex Playground. Free for Center Plus Family and All Access Family members. Parents must remain on the property.</p>

                      <h4 className="text-md font-semibold text-neutral-700">Child Watch</h4>
                      <p className="text-sm text-neutral-700">PA safe, fun space for kids (ages 3 months–9 years) while parents enjoy the Community Center. Staff lead play, crafts, and age-appropriate 
                        activities that keep little ones engaged. Each visit is up to 90 minutes, and parents must stay on-site. Free for Center Plus Family and All 
                        Access Family members, with drop-in rates available.</p>

                      <h4 className="text-md font-semibold text-neutral-700">Jungle Gym</h4>
                      <p className="text-sm text-neutral-700">Parent-child playtime for ages under 6, featuring padded floors, balance beams, and soft gym equipment. Kids can climb, tumble, and explore 
                        while building coordination and confidence. Free for Center Plus Family and All Access Family members, with drop-in options available.</p>

                      <h4 className="text-md font-semibold text-neutral-700">Family Fun Nights</h4>
                      <p className="text-sm text-neutral-700">Bring everyone together for games, crafts, themed activities, and a photo booth. Each event is a little different and perfect for all ages. 
                        Free for members; $7 per non-member participant.</p>
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-gmcc-navy mb-3">For Individuals</h2>
                  <h3 className="text-md font-semibold text-gmcc-navy">For teens, seniors, and everyone in between, see what the Community Center offers you:</h3>
                  <div className="grid gap-4 md:grid-cols-[1.5fr_1fr] items-stretch">
                    <div className="space-y-2">
                      <h4 className="text-md font-semibold text-neutral-700">Group Fitness Classes</h4>
                      <p className="text-sm text-neutral-700">Classes make it easy to stay motivated with options for every level—strength, cardio, cycling, yoga, dance, and more. Led by certified instructors, 
                        classes are designed to energize, challenge, and build community. Free with All Access Membership.</p>

                      <h4 className="text-md font-semibold text-neutral-700">Strength & Weight Training</h4>
                      <p className="text-sm text-neutral-700">Our strength and weight training areas feature free weights, squat racks, cable machines, benches, and functional training equipment. Whether you're 
                        new to lifting or building a serious routine, you'll find everything you need to get stronger and train effectively.</p>

                      <h4 className="text-md font-semibold text-neutral-700">Cardio Training</h4>
                      <p className="text-sm text-neutral-700">The cardio deck includes treadmills, ellipticals, and more! Perfect for warm-ups, endurance work, or full training sessions. Machines offer a variety 
                        of programs and resistance levels so you can go at your own pace.</p>

                      <h4 className="text-md font-semibold text-neutral-700">Personal Training</h4>
                      <p className="text-sm text-neutral-700">Our goal is to inspire and enable individuals of all ages and fitness levels to reach their health and wellness goals through personalized training 
                        programs that foster long-term success and well-being. All our trainers are highly educated and certified and offer flexible schedules. Let them help you reach your goals! </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <img src="/GroupFitnessPhoto.png" alt="Group Fitness Classes" className="w-full flex-1 object-cover rounded-md" />
                      <img src="/PersonalTrainingPhoto.png" alt="Personal Training" className="w-full flex-1 object-cover rounded-md" />
                    </div>
                  </div>


                  {/* Testimonials */}
                  {centerTestimonials.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold text-gmcc-navy mb-3">
                        Don't just take our word for it, see what our members have to say:
                      </h2>
                      <div className="grid gap-4 md:grid-cols-2">
                        {centerTestimonials.map((t: any) => {
                          const tf = t.testimonialFields ?? {};
                          return (
                            <figure
                              key={t.slug}
                              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
                            >
                              {tf.quote && (
                                <blockquote className="text-sm text-neutral-700 whitespace-pre-line mb-4">
                                  "{tf.quote}"
                                </blockquote>
                              )}
                              <figcaption className="flex items-center gap-3">
                                {t.featuredImage?.node?.sourceUrl && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={t.featuredImage.node.sourceUrl}
                                    alt={t.featuredImage.node.altText ?? ""}
                                    className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                                  />
                                )}
                                <div className="text-xs text-neutral-600">
                                  {tf.personName && (
                                    <div className="font-semibold text-neutral-900">
                                      {tf.personName}
                                    </div>
                                  )}
                                  {tf.personContext && (
                                    <div>{tf.personContext}</div>
                                  )}
                                </div>
                              </figcaption>
                            </figure>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* <h2 className="text-xl font-bold text-gmcc-navy mb-3">Membership Options</h2>
                  <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                    {centerMemberships.length > 0 ? (
                      <div className="space-y-3">
                        <ul className="space-y-2">
                          {centerMemberships.map((name: string, i: number) => (
                            <li key={i} className="text-sm text-neutral-700">
                              {name}
                            </li>
                          ))}
                        </ul>
                        <a
                          href={`/membership/center/${slug}`}
                          className="block mt-4 text-sm text-blue-600 hover:underline text-center"
                        >
                          View details for all options →
                        </a>
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500">
                        Membership information coming soon.
                      </p>
                    )}
                  </div> */}
                </div>

                {/* RIGHT SIDEBAR - STICKY */}
                <aside className="lg:sticky lg:top-6 h-fit">
                  {/* Call to Action */}
                  <div className="rounded-2xl border border-neutral-200 bg-gmcc-blue-light/30 p-6 max-w-xs text-center">
                    <h2 className="text-xl font-bold text-gmcc-navy mb-2 text-left">
                      Ready to Join?
                    </h2>
                    <p className="text-sm text-neutral-700 mb-4 text-left">
                      Explore all membership options, compare pricing, and find the perfect fit for you or your family.
                    </p>
                    <a
                      href={`/membership/center/${slug}`}
                      className="button-primary"
                    >
                      View Membership Options
                    </a>
                    <p className="text-sm text-neutral-700 mt-4 mb-4 text-left">
                      Not sure yet? Schedule a free tour!
                    </p>
                    <a
                      href={`/membership/center/${slug}`}
                      className="button-secondary"
                    >
                      Schedule a Tour
                    </a>
                  </div>
                </aside>
              </div>
            ),
          },
        ]}
      />
      </div>
    </main>
  );
}