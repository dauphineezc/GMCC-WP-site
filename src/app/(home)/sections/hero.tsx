// src/app/(home)/sections/HeroSection.tsx
type Linkish = { title?: string | null; url?: string | null };

function isLikelyHtml(str: string) {
  return /<iframe|<video|<embed/i.test(str);
}

function toYouTubeEmbed(url: string) {
  // basic conversion if you store raw youtube urls
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname.includes("youtu.be")) {
      const v = u.pathname.replace("/", "");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    // leave as-is for Vimeo etc
    return url;
  } catch {
    return url;
  }
}

export default function HeroSection({
  headline,
  subheadline,
  mediaOEmbed,
  imageUrl,
  imageAlt,
  primaryCta,
  secondaryCta,
}: {
  headline: string;
  subheadline: string;
  mediaOEmbed?: string | null;
  imageUrl?: string | null;
  imageAlt?: string;
  primaryCta: Linkish;
  secondaryCta?: Linkish | null;
}) {
  const embedUrl = mediaOEmbed && !isLikelyHtml(mediaOEmbed) ? toYouTubeEmbed(mediaOEmbed) : null;
  const hasVideo = !!mediaOEmbed;
  const hasImage = !hasVideo && !!imageUrl;

  return (
    // <section className="px-4 pt-8">
    <section className="section-y">
      {/* <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl bg-neutral-100"> */}
      <div className="relative w-full overflow-hidden bg-neutral-100 mb-8">
        <div className="relative">
          {/* Media */}
          <div className="relative h-[500px] w-full bg-neutral-200">
            {hasVideo ? (
              isLikelyHtml(mediaOEmbed!) ? (
                <div
                  className="absolute inset-0"
                  dangerouslySetInnerHTML={{ __html: mediaOEmbed! }}
                />
              ) : (
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={embedUrl ?? mediaOEmbed!}
                  title={headline}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )
            ) : hasImage ? (
              <img
                src={imageUrl!}
                alt={imageAlt || ""}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
            <div className="absolute inset-0 bg-black/40" />
          </div>

          {/* Copy */}
          <div className="absolute inset-0 flex items-center">
            <div className="w-full px-8 py-10 md:px-12">
              <div className="max-w-2xl text-white">
                <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">{headline}</h1>
                <p className="mt-4 text-base leading-relaxed text-white/90 md:text-lg">{subheadline}</p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {primaryCta?.url ? (
                    <a
                      href={primaryCta.url}
                      className="btn btn-hero"
                    >
                      {primaryCta.title || "Learn more"}
                    </a>
                  ) : null}

                  {secondaryCta?.url ? (
                    <a
                      href={secondaryCta.url}
                      className="inline-flex items-center justify-center rounded-xl border border-white/60 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20"
                    >
                      {secondaryCta.title || "Explore"}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
