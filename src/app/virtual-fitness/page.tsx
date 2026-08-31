import { wpFetch } from "@/lib/wp";
import SolidNavyWaveHeader from "@/components/solidNavyWaveHeader";
import Tabs from "@/components/tabs";
import { WP_MEDIA_IMAGE_FIELDS, mediaFocalPositionCss } from "@/lib/mediaFocalPoint";
import JotFormEmbed from "@/components/jotFormEmbed";


const VIRTUAL_FITNESS_PAGE_QUERY = /* GraphQL */ `
  query VirtualFitnessPage($uri: ID!) {
    page(id: $uri, idType: URI) {
      id
      title
      slug

      virtualFitnessPageFields {
        header
        subheader

        memberPortalCta {
          label
          link {
            title
            url
            target
          }
        }

        scheduleCta {
          label
          link {
            title
            url
            target
          }
        }

        contentImage1 {
          node {
            ${WP_MEDIA_IMAGE_FIELDS}
            mediaDetails { width height }
          }
        }

        contentImage2 {
          node {
            ${WP_MEDIA_IMAGE_FIELDS}
            mediaDetails { width height }
          }
        }

        whatSectionHeader
        whatSectionBody
        whoSectionHeader
        whoSectionBody
        whoSectionMembershipList
        howSectionHeader
        howSectionMemberText
        howSectionFormText

        scheduleHeader

        currentMonthSchedule {
          monthLabel
          file {
            node {
              ${WP_MEDIA_IMAGE_FIELDS}
              mediaDetails {
                width
                height
              }
            }
          }
        }

        nextMonthSchedule {
          monthLabel
          file {
            node {
              ${WP_MEDIA_IMAGE_FIELDS}
              mediaDetails {
                width
                height
              }
            }
          }
        }
      }
    }
  }
`;

export default async function VirtualFitnessPage() {
  const data = await wpFetch<any>(VIRTUAL_FITNESS_PAGE_QUERY, { uri: "/virtual-fitness" });
  const f = data?.page?.virtualFitnessPageFields;
  const renderScheduleFile = (
    url?: string,
    label?: string,
    mediaNode?: Parameters<typeof mediaFocalPositionCss>[0],
  ) => {
    if (!url) {
      return <p className="text-neutral-600">Schedule file unavailable.</p>;
    }

    const normalizedUrl = url.split("?")[0]?.toLowerCase() ?? "";
    const isPdf = normalizedUrl.endsWith(".pdf");
    const isImage = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].some((ext) =>
      normalizedUrl.endsWith(ext),
    );

    if (isPdf) {
      return (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-neutral-300 bg-white">
            <iframe
              src={url}
              title={label ? `${label} schedule PDF` : "Schedule PDF"}
              className="h-[720px] w-full"
            />
          </div>
        </div>
      );
    }

    if (isImage) {
      const objectPosition = mediaFocalPositionCss(mediaNode);
      return (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-neutral-300 bg-white">
            <img
              src={url}
              alt={label ? `${label} schedule` : "Schedule"}
              className="h-auto w-full object-contain"
              style={objectPosition ? { objectPosition } : undefined}
            />
          </div>
        </div>
      );
    }

    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-gmcc-teal underline">
        Open schedule file
      </a>
    );
  };

  return (
    <main className="pb-16">
      <SolidNavyWaveHeader title={f?.header} description={f?.subheader} children={<div className="mt-8 flex gap-2">
        <a href={f?.memberPortalCta?.link?.url} target={f?.memberPortalCta?.link?.target ?? undefined} className="btn btn-tertiary">
          {f?.memberPortalCta?.label}
        </a>
        <a href={f?.scheduleCta?.link?.url} target={f?.scheduleCta?.link?.target ?? undefined} className="btn btn-secondary">
          {f?.scheduleCta?.label}
        </a>
      </div>} />

      <section className="mx-auto max-w-6xl px-6 mt-4">
        <div className="grid items-center gap-10 md:grid-cols-2 md:items-start">
          <div className="md:order-1">
            {f?.whatSectionHeader ? (
              <h3 className="text-xl font-bold text-gmcc-navy md:text-2xl">{f?.whatSectionHeader}</h3>
            ) : null}
            {f?.whatSectionBody ? <p className="mt-4 leading-relaxed text-neutral-700">{f?.whatSectionBody}</p> : null}

            {f?.whoSectionHeader ? (
              <h3 className="mt-8 text-xl font-bold text-gmcc-navy md:text-2xl">{f?.whoSectionHeader}</h3>
            ) : null}
            {f?.whoSectionBody ? <>
              <p className="mt-4 leading-relaxed text-neutral-700">{f?.whoSectionBody}</p>
              <ul className="mt-2 list-disc pl-5 body">
                {f?.whoSectionMembershipList?.split('\n').map((b: string, i: number) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
              <p className="mt-2 leading-relaxed text-neutral-700">Not a member?
                <a href={"/membership"} className="ml-4 text-gmcc-teal underline">Explore membership options →</a>
              </p>
              </>
            : null}
          </div>

          <div className="overflow-hidden flex flex-col md:order-2">
            <div className="aspect-[16/9] h-full">
              <img
                src={f?.contentImage1?.node?.sourceUrl}
                alt={f?.contentImage1?.node?.title}
                className="w-full h-full object-cover"
                style={(() => {
                  const pos = mediaFocalPositionCss(f?.contentImage1?.node);
                  return pos ? { objectPosition: pos } : undefined;
                })()}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 mx-auto max-w-6xl px-6">
        {f?.howSectionHeader ? (
          <h3 className="text-xl font-bold text-gmcc-navy md:text-2xl">{f?.howSectionHeader}</h3>
        ) : null}
        {f?.howSectionMemberText ? 
          <>
            <p className="mt-4 leading-relaxed text-neutral-700">{f?.howSectionMemberText}
              <a href={f?.memberPortalCta?.link?.url} target={f?.memberPortalCta?.link?.target ?? undefined} className="btn btn-primary ml-4">
                {f?.memberPortalCta?.label}
              </a>
            </p>
          </>
        : null}
        {f?.howSectionFormText ? <p className="mt-4 leading-relaxed text-neutral-700">{f?.howSectionFormText}</p> : null}
      </section>

      <div className="relative overflow-hidden -mt-0 pb-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-25">
          <img
            src="/GreaterLogoBG.png"
            alt=""
            className="absolute left-15 bottom-30 w-0 select-none lg:w-100"
            draggable={false}
          />
          <img
            src="/GreaterLogoBG.png"
            alt=""
            className="absolute right-15 top-30 w-0 select-none lg:w-100"
            draggable={false}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-10 lg:-mt-8 lg:-mb-8">
          <JotFormEmbed formId="262396102037149" />
        </div>
      </div>

        <section className="mt-8 mx-auto max-w-6xl px-6">
          {f?.scheduleHeader ? (
            <h3 className="text-xl font-bold text-gmcc-navy md:text-2xl">{f?.scheduleHeader}</h3>
           ) : null}

          {/* Tabs */}
          <Tabs tabs={[
            {
              id: "current",
              label: f?.currentMonthSchedule?.monthLabel ?? "Current Month",
              content: (
                <div className="stack-6 pt-4">
                  <div className="grid gap-16 md:px-32 px-12 items-center">
                    <div className="stack-3">
                      {renderScheduleFile(
                        f?.currentMonthSchedule?.file?.node?.sourceUrl,
                        f?.currentMonthSchedule?.monthLabel,
                        f?.currentMonthSchedule?.file?.node,
                      )}
                    </div>
                  </div>
                </div>
              ),
            },
            {
              id: "next",
              label: f?.nextMonthSchedule?.monthLabel ?? "Next Month",
              content: (
                <div className="stack-6 pt-4">
                  <div className="grid gap-16 md:px-32 px-12 items-center">
                    <div className="stack-3">
                      {renderScheduleFile(
                        f?.nextMonthSchedule?.file?.node?.sourceUrl,
                        f?.nextMonthSchedule?.monthLabel,
                        f?.nextMonthSchedule?.file?.node,
                      )}
                    </div>
                  </div>
                </div>
              ),
            },
        ]} />
        </section>
    </main>
  );
}

export async function generateMetadata() {
  const { getYoastMetadata } = await import("@/lib/wordpress/seo");
  return getYoastMetadata("/virtual-fitness");
}