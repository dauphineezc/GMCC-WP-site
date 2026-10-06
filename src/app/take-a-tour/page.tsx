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

const TAKE_A_TOUR_PAGE_QUERY = /* GraphQL */ `
  query TakeATourPage($uri: ID!) {
    page(id: $uri, idType: URI) {
      id
      title
      slug
      takeATourPageFields {
        header
        subheader
        tourHeader
        tourDescription
      }
    }
  }
`;

export default async function TakeATourPage() {
  const data = await wpFetch<any>(TAKE_A_TOUR_PAGE_QUERY, { uri: "/take-a-tour" });
  const f = data?.page?.takeATourPageFields;

  const centerOrder = CENTER_TITLE_ORDER;

  return (
    <main>
      <SolidNavyWaveHeader title={f?.header} description={f?.subheader} />

      <section className="page-section">
        <h2 className="text-center text-xl font-extrabold text-gmcc-navy md:text-left md:text-2xl">
          {f?.tourHeader}
        </h2>
        <p className="mt-4 mb-4 text-center text-lg text-neutral-700 md:text-left">{f?.tourDescription}</p>
      </section>

      <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-10 lg:-mt-32 lg:-mb-16">
          <JotFormEmbed formUrl="https://form.jotform.com/252224900317044"  />
        </div>
    </main>
  );
}

export async function generateMetadata() {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/take-a-tour");
}