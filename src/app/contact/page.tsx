import { wpFetch } from "@/lib/wp";
import { CENTER_TITLE_ORDER } from "@/lib/constants";
import SolidNavyWaveHeader from "@/components/solidNavyWaveHeader";
import PhoneLink from "@/components/phoneLink";
import JotFormEmbed from "@/components/jotFormEmbed";

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-gmcc-teal" aria-hidden="true">
      <path
        d="M12 22c-4.2-4.9-7-8.3-7-12a7 7 0 1 1 14 0c0 3.7-2.8 7.1-7 12Zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-gmcc-teal" aria-hidden="true">
      <path
        d="M7.6 2h3.1c.6 0 1.1.4 1.2 1l.7 3.2c.1.5-.1 1-.5 1.3L10 9.5a14.4 14.4 0 0 0 4.5 4.5l2-2.1c.3-.4.8-.6 1.3-.5l3.2.7c.6.1 1 .6 1 1.2v3.1c0 .7-.6 1.3-1.3 1.3C11.6 18 6 12.4 6.3 3.3 6.3 2.6 6.9 2 7.6 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

const CONTACT_PAGE_QUERY = /* GraphQL */ `
  query ContactPage($uri: ID!) {
    page(id: $uri, idType: URI) {
      id
      title
      slug
  
      contactPageFields {
        subheading
        heading

        centers {
          nodes {
            ...on Center {
              title
              slug
              centersFields {
                address
                contactInfo {
                  contactPhone
                  contactEmail
                }
              }
            }
          }
        }
        contactFormHeading
        contactFormDescription

        serveWithHeartStatement
        serveWithHeartButtonLabel
        serveWithHeartButtonLink
      }
    }
  }
`;

export default async function ContactPage() {
  const data = await wpFetch<any>(CONTACT_PAGE_QUERY, { uri: "/contact" });
  const f = data?.page?.contactPageFields;
  const centerOrder = CENTER_TITLE_ORDER;
  const centers = (f?.centers?.nodes ?? [])
    .filter((center: any) => !!center?.title)
    .sort((a: any, b: any) => {
      const aIndex = centerOrder.indexOf(String(a?.title ?? "").trim().toLowerCase());
      const bIndex = centerOrder.indexOf(String(b?.title ?? "").trim().toLowerCase());
      const normalizedA = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
      const normalizedB = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
      return normalizedA - normalizedB;
    });

  return (
    <main>
      <SolidNavyWaveHeader eyebrow={f?.subheading} title={f?.heading} />

      {centers.length ? (
        <section className="relative z-30 mx-auto -mt-16 max-w-6xl px-6 md:-mt-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {centers.map((center: any) => {
              const phone = center?.centersFields?.contactInfo?.contactPhone;
              const address = center?.centersFields?.address;
              const href = center?.slug ? `/centers/${center.slug}` : "#";

              return (
                <article key={center.slug ?? center.title} className="border border-neutral-200 rounded-2xl bg-white px-4 py-4 shadow-sm">
                  <h3 className="text-center text-xl font-bold text-gmcc-navy">{center.title}</h3>

                  {address ? (
                    <p className="mt-3 flex items-start justify-left gap-2 text-sm text-neutral-700">
                      <LocationIcon />
                      <span>{address}</span>
                    </p>
                  ) : null}

                  {phone ? (
                    <div className="mt-4 flex items-center justify-left gap-2 text-sm text-neutral-700">
                      <PhoneIcon />
                      <PhoneLink phone={phone} className="text-sm text-neutral-700 hover:text-gmcc-teal hover:underline" />
                    </div>
                  ) : null}

                  <div className="mt-3 text-center">
                    <a href={href} className="text-sm text-center font-semibold text-gmcc-teal hover:underline">
                      Visit Center Page →
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="page-section">
        <h2 className="mt-12 md:mt-8 text-center text-2xl font-extrabold text-gmcc-navy md:text-left md:text-2xl">
          {f?.contactFormHeading}
        </h2>
        <p className="mt-4 text-center text-lg text-neutral-700 md:text-left">{f?.contactFormDescription}</p>
      </section>

      <div className="relative overflow-hidden -mt-0 pb-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-25">
          <img
            src="/GreaterLogoBG.png"
            alt=""
            className="absolute left-15 bottom-70 w-0 select-none lg:w-100"
            draggable={false}
          />
          <img
            src="/GreaterLogoBG.png"
            alt=""
            className="absolute right-15 top-20 w-0 select-none lg:w-100"
            draggable={false}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-10 lg:-mt-16">
          <JotFormEmbed />
        </div>
      </div>

      {f?.serveWithHeartStatement ? (
        <section className="page-section">
          <p className="text-center text-lg text-neutral-700 mb-2">{f?.serveWithHeartStatement}</p>
          <div className="text-center">
            <a
              href={f?.serveWithHeartButtonLink ?? "#"}
              className="btn bg-gmcc-navy text-white hover:bg-gmcc-navy/80 mt-6 text-base px-8 py-3"
            >
              {f?.serveWithHeartButtonLabel}
            </a>
          </div>
        </section>
      ) : null}
    </main>
  );
}

export async function generateMetadata() {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/contact");
}