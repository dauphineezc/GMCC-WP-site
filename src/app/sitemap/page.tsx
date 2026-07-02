import SolidNavyWaveHeader from "@/components/solidNavyWaveHeader";
import SitemapNavTree, {
  SitemapFlatLinks,
  SitemapLink,
} from "@/components/sitemap/sitemapNavTree";
import { getFooterNav } from "@/lib/nav/getFooterNav";
import { getPrimaryNav } from "@/lib/nav/getPrimaryNav";
import { getUtilityNav } from "@/lib/nav/getUtilityMenu";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sitemap",
  description: "Browse all pages and sections on the Greater Midland website.",
};

export default async function SitemapPage() {
  const [primaryNav, utilityNav, footerNav] = await Promise.all([
    getPrimaryNav(),
    getUtilityNav(),
    getFooterNav(),
  ]);

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

        {sitemapUtilityNav.length > 0 ? (
          <section className="mb-12">
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
    </main>
  );
}
