import { wpFetch } from "@/lib/wp";
import SolidNavyWaveHeader from "@/components/solidNavyWaveHeader";
import PhoneLink from "@/components/phoneLink";

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
      }
    }
  }
`;

export default async function ContactPage() {
  const data = await wpFetch<any>(CONTACT_PAGE_QUERY, { uri: "/contact" });
  const f = data?.page?.contactPageFields;
  const centerOrder = [
    "community center",
    "tennis center",
    "coleman family center",
    "north family center",
    "curling center",
  ];
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
    <main className="pb-16">
      <SolidNavyWaveHeader eyebrow={f?.subheading} title={f?.heading} />

      {centers.length ? (
        <section className="relative z-30 mx-auto -mt-24 max-w-6xl px-6 md:-mt-24">
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

      <section className="mx-auto mt-8 max-w-6xl px-6 stack-2">
        <h2 className="mt-8 text-center text-xl font-extrabold text-gmcc-navy md:text-left md:text-2xl">
          {f?.contactFormHeading}
        </h2>
        <p className="mb-4 text-center text-lg text-neutral-700 md:text-left">{f?.contactFormDescription}</p>
      </section>

      {/* Placeholder contact form (visual only) */}
      <div className="relative mt-8 overflow-hidden pb-8">
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-25">
            <img
              src="/GreaterLogoBG.png"
              alt=""
              className="absolute left-10 bottom-0 w-58 select-none md:w-80"
              draggable={false}
            />
            <img
              src="/GreaterLogoBG.png"
              alt=""
              className="absolute right-10 top-0 w-58 select-none md:w-80"
              draggable={false}
            />
          </div>

        <div className="mx-auto max-w-6xl px-10">
          <div className="relative mx-auto w-full rounded-2xl border border-neutral-300 bg-neutral-100 p-10 shadow-sm lg:w-[calc((3*(100%-4rem))/5+2rem)]">
            <h3 className="h2 text-4xl text-gmcc-navy">Contact Form</h3>

            <form className="mt-4 space-y-4" aria-label="Placeholder contact form">
              <div>
                <label htmlFor="contact-name" className="block text-sm text-neutral-700">
                  Name
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  placeholder=""
                  className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm outline-none focus:border-gmcc-teal"
                />
              </div>

              <div>
                <label htmlFor="contact-email" className="block text-sm text-neutral-700">
                  Email address
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  placeholder=""
                  className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm outline-none focus:border-gmcc-teal"
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-sm text-neutral-700">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={5}
                  className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm outline-none focus:border-gmcc-teal"
                />
              </div>

              <div className="pt-1 text-center">
                <button type="button" className="btn btn-primary min-w-28">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* </section> */}

      {f?.serveWithHeartStatement ? (
        <section className="mx-auto mt-16 max-w-6xl px-6 stack-2">
          <p className="mb-4 text-center text-lg text-neutral-700">{f?.serveWithHeartStatement}</p>
        </section>
      ) : null}
    </main>
  );
}