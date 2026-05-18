"use client";

import { useMemo, useState } from "react";
import type { EceCenterSlug, SerializedEceProgram } from "./page";
import CentersBadgesOneLine from "@/components/centersBadgesOneLine";

type DocLink = { label: string; href: string };

export type EarlyChildhoodCentersClientProps = {
  programsHeader: string;
  programsDescription: string;
  importantDocumentsHeader: string;
  centers: { slug: EceCenterSlug; label: string }[];
  documentsByCenter: Record<EceCenterSlug, DocLink[]>;
  programsByCenter: Record<EceCenterSlug, SerializedEceProgram[]>;
};

function DownloadChevron() {
  return (
    <svg
      className="ml-2 h-4 w-4 shrink-0 text-gmcc-navy transition-transform group-hover:translate-y-0.5 group-hover:text-gmcc-navy"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

export default function EarlyChildhoodCentersClient({
  programsHeader,
  programsDescription,
  importantDocumentsHeader,
  centers,
  documentsByCenter,
  programsByCenter,
}: EarlyChildhoodCentersClientProps) {
  const [activeSlug, setActiveSlug] = useState<EceCenterSlug>(centers[0]?.slug ?? "community-center");

  const activeDocs = useMemo(() => documentsByCenter[activeSlug] ?? [], [documentsByCenter, activeSlug]);
  const activePrograms = useMemo(() => programsByCenter[activeSlug] ?? [], [programsByCenter, activeSlug]);

  const activeLabel = centers.find((c) => c.slug === activeSlug)?.label ?? "";

  return (
    <section id="programs-by-center" className="mx-auto max-w-6xl px-6 pt-16 pb-16">
      {programsHeader ? <h2 className="h2 text-gmcc-navy">{programsHeader}</h2> : null}
      {programsDescription ? (
        <div className="body mt-3 text-neutral-700 whitespace-pre-line">{programsDescription}</div>
      ) : null}

      <div className="mb-8 mt-8 flex flex-wrap gap-2">
        {centers.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => setActiveSlug(c.slug)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
              activeSlug === c.slug
                ? "bg-gmcc-navy text-white shadow-md"
                : "border border-neutral-200 bg-white text-gmcc-navy hover:border-gmcc-navy/40"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {activePrograms.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activePrograms.map((p) => (
              <a
                key={p.slug}
                href={`/programs/${p.slug}`}
                className="group card card-hover card-link flex flex flex-col overflow-hidden"
              >
                <div className="card-bleed relative aspect-[16/9] bg-neutral-100">
                  {p.heroUrl ? (
                    <img
                      src={p.heroUrl}
                      alt={p.heroAlt ?? ""}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
                </div>

                <div className="mt-5 flex min-h-0 flex-1 flex-col">
                  <h3 className="line-clamp-1 font-heading text-lg font-medium leading-normal text-neutral-900 group-hover:text-gmcc-teal">
                    {p.title}
                  </h3>

                  <CentersBadgesOneLine centers={p.centerSlugs.map((slug) => ({ slug, title: centers.find((c) => c.slug === slug)?.label ?? "" }))} />

                  {p.summary ? (
                    <p className="mb-3 mt-3 line-clamp-3 text-xs leading-6 text-neutral-600">{p.summary}</p>
                  ) : null}

                  <div className="mt-auto flex items-center justify-between border-t border-neutral-100 pt-4">
                    {p.priceFrom != null ? (
                      <div className="text-sm">
                        <span className="text-neutral-500">From </span>
                        <span className="font-semibold text-neutral-900">${p.priceFrom.toFixed(2)}</span>
                      </div>
                    ) : (
                      <div />
                    )}
                    <span className="text-sm font-semibold text-gmcc-navy underline-offset-4 group-hover:underline">
                      View →
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center">
            <p className="body text-neutral-600">
              No early childhood programs are assigned to this center yet. Browse all{" "}
              <a href="/programs" className="link">
                programs
              </a>
              .
            </p>
          </div>
        )}
      </div>

      <div className="justify-center items-center">
        {importantDocumentsHeader ? (
          <h3 className="h3 mt-12 mb-3 text-center text-gmcc-navy">{importantDocumentsHeader} — {activeLabel}</h3>
        ) : (
          <h3 className="h3 mb-3 text-center text-gmcc-navy">Important documents — {activeLabel}</h3>
        )}
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {activeDocs.length ? (
            activeDocs.map((item, i) => (
              <a
                key={`${activeSlug}-doc-${i}-${item.href}`}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 transition-all hover:border-gmcc-teal hover:bg-white hover:shadow-md"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold text-gmcc-navy">{item.label}</span>
                </div>
                <DownloadChevron />
              </a>
            ))
          ) : (
            <p className="body text-center text-sm text-neutral-500">No documents uploaded for this center yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
