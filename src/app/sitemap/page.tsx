import SolidNavyWaveHeader from "@/components/solidNavyWaveHeader";
import SitemapNavTree, {
  SitemapFlatLinks,
  SitemapLink,
} from "@/components/sitemap/sitemapNavTree";
import { fetchAllAmenityLinks } from "@/lib/amenities";
import { getFooterNav } from "@/lib/nav/getFooterNav";
import { getPrimaryNav } from "@/lib/nav/getPrimaryNav";
import { getUtilityNav } from "@/lib/nav/getUtilityMenu";
import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/sitemap");
}

export default async function SitemapPage() {
  const [primaryNav, utilityNav, footerNav, amenityLinks] = await Promise.all([
    getPrimaryNav(),
    getUtilityNav(),
    getFooterNav(),
    fetchAllAmenityLinks(),
  ]);

  const amenityNavItems = amenityLinks.map((amenity) => ({
    id: amenity.slug,
    label: amenity.name,
    href: `/amenities/${amenity.slug}`,
  }));

  const sitemapUtilityNav = utilityNav.filter((item) => {
    const label = item.label.toLowerCase();
    return label !== "accessibility options" && label !== "language";
  });

  return (
    <main>
      <SolidNavyWaveHeader
        title="Sitemap"
        description="A complete list of pages and sections to help you find what you need on the Greater Midland website."
      />

      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <section className="mb-12">
          <h2 className="h2 mb-4">Home</h2>
          <ul className="space-y-2">
            <li>
              <Link
                href="/"
                className="text-gmcc-navy hover:text-gmcc-teal hover:underline underline-offset-2 transition-colors"
              >
                Home
              </Link>
            </li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="h2 mb-6">Main navigation</h2>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {primaryNav.map((section) => (
              <div key={section.id}>
                <h3 className="font-heading text-lg font-semibold text-gmcc-navy mb-3">
                  <SitemapLink href={section.href} label={section.label} />
                </h3>
                {section.children.length > 0 ? (
                  <SitemapNavTree items={section.children} />
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-12">
            {amenityNavItems.length > 0 ? (
              <section>
                <h2 className="h2 mb-4">Amenities</h2>
                <SitemapFlatLinks items={amenityNavItems} />
              </section>
            ) : null}
          </div>

          <div className="space-y-12">
            {sitemapUtilityNav.length > 0 ? (
              <section>
                <h2 className="h2 mb-4">Quick links</h2>
                <SitemapFlatLinks items={sitemapUtilityNav} />
              </section>
            ) : null}

            {footerNav.length > 0 ? (
              <section>
                <h2 className="h2 mb-4">Footer</h2>
                <SitemapFlatLinks items={footerNav} />
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
