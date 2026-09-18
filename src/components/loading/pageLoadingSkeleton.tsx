import { WAVE_BLEED_CLIP_CLASS, WAVE_SVG_BLEED_CLASS, WaveEdgeBar } from "@/components/waveSeam";

type PageLoadingSkeletonProps = {
  /** Hero style: photo-wave (centers) or solid navy (programs / events / news). */
  variant?: "photo" | "navy";
  /** Body placeholder under the hero. */
  layout?: "center" | "detail" | "article";
};

function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-white/20 ${className}`} aria-hidden />;
}

function ContentPulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-neutral-200 ${className}`} aria-hidden />;
}

function BottomWave({
  fillClassName,
  edgeClassName,
  heightClassName,
}: {
  fillClassName: string;
  edgeClassName: string;
  heightClassName: string;
}) {
  return (
    <div className="pointer-events-none absolute -bottom-[3px] left-0 z-10 w-full leading-none">
      <div className={WAVE_BLEED_CLIP_CLASS}>
        <svg
          viewBox="0 0 1440 120"
          className={`${WAVE_SVG_BLEED_CLASS} ${heightClassName} ${fillClassName}`}
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="
              M-20,110
              C750,-90  800,120  1200,80
              S1420,0 1460,0
              L1460,120 L-20,120 Z
            "
            fill="currentColor"
          />
        </svg>
      </div>
      <WaveEdgeBar side="bottom" className={edgeClassName} />
    </div>
  );
}

function PhotoHeroSkeleton() {
  return (
    <section className="relative z-10 mb-0 bg-gmcc-navy py-6 md:min-h-[max(400px,70dvh)]">
      <div className="relative z-20 max-w-6xl px-8 pb-12 pt-10 md:px-12 md:pb-24 md:pt-16">
        <div className="mt-6 flex items-center gap-3 md:mt-8">
          <LoadingSpinner className="h-7 w-7 text-white/80 md:h-8 md:w-8" />
          <span className="text-sm font-medium tracking-wide text-white/80 md:text-base">
            Loading…
          </span>
        </div>
        <Pulse className="mt-6 h-12 w-3/4 max-w-xl md:h-16" />
        <Pulse className="mt-6 h-5 w-full max-w-2xl md:h-6" />
        <Pulse className="mt-3 h-5 w-2/3 max-w-xl md:h-6" />
        <div className="mt-8 flex flex-wrap gap-3">
          <Pulse className="h-11 w-32" />
          <Pulse className="h-11 w-36" />
        </div>
      </div>
      <BottomWave
        fillClassName="text-gmcc-navy"
        edgeClassName="bg-gmcc-navy"
        heightClassName="h-10 md:h-16"
      />
    </section>
  );
}

function NavyHeroSkeleton() {
  return (
    <section className="relative bg-gmcc-navy">
      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-12 md:pb-38 lg:pt-24">
        <div className="flex items-center gap-3">
          <LoadingSpinner className="h-6 w-6 text-white/80" />
          <span className="text-sm font-medium tracking-wide text-white/80">Loading…</span>
        </div>
        <Pulse className="mt-4 h-10 w-3/4 max-w-lg md:h-12" />
        <Pulse className="mt-4 h-5 w-full max-w-2xl" />
        <Pulse className="mt-3 h-5 w-4/5 max-w-xl" />
      </div>
      <BottomWave
        fillClassName="text-white"
        edgeClassName="bg-white"
        heightClassName="h-12 md:h-20"
      />
    </section>
  );
}

function CenterBodySkeleton() {
  return (
    <>
      <section className="bg-gmcc-navy">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-16">
          {[0, 1, 2].map((i) => (
            <div key={i} className="stack-3">
              <Pulse className="h-7 w-28" />
              <Pulse className="h-4 w-full" />
              <Pulse className="h-4 w-4/5" />
              <Pulse className="h-4 w-3/5" />
            </div>
          ))}
        </div>
      </section>
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-12">
        <ContentPulse className="h-8 w-48" />
        <ContentPulse className="h-4 w-full" />
        <ContentPulse className="h-4 w-11/12" />
        <ContentPulse className="h-4 w-4/5" />
        <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <ContentPulse key={i} className="h-40" />
          ))}
        </div>
      </div>
    </>
  );
}

function DetailBodySkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 section-y">
      <div className="mb-6 flex flex-wrap gap-2">
        {[0, 1, 2, 3].map((i) => (
          <ContentPulse key={i} className="h-7 w-20" />
        ))}
      </div>
      <section className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
        <div className="min-w-0 space-y-4">
          <ContentPulse className="h-4 w-full" />
          <ContentPulse className="h-4 w-11/12" />
          <ContentPulse className="h-4 w-4/5" />
          <ContentPulse className="h-4 w-full" />
          <ContentPulse className="h-4 w-3/4" />
          <ContentPulse className="mt-8 h-48 w-full" />
        </div>
        <aside className="space-y-4">
          <ContentPulse className="h-64 w-full" />
          <ContentPulse className="h-40 w-full" />
        </aside>
      </section>
    </div>
  );
}

function ArticleBodySkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-6 py-12">
      <ContentPulse className="h-4 w-40" />
      <ContentPulse className="h-4 w-full" />
      <ContentPulse className="h-4 w-11/12" />
      <ContentPulse className="h-4 w-4/5" />
      <ContentPulse className="mt-6 h-56 w-full" />
      <ContentPulse className="h-4 w-full" />
      <ContentPulse className="h-4 w-5/6" />
      <ContentPulse className="h-4 w-2/3" />
    </div>
  );
}

/**
 * Route-level loading placeholder. Keeps the root nav/footer visible while
 * the page segment streams in (soft navigations via `loading.tsx`).
 */
export default function PageLoadingSkeleton({
  variant = "navy",
  layout = "detail",
}: PageLoadingSkeletonProps) {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading page content</span>
      {variant === "photo" ? <PhotoHeroSkeleton /> : <NavyHeroSkeleton />}
      {layout === "center" ? <CenterBodySkeleton /> : null}
      {layout === "detail" ? <DetailBodySkeleton /> : null}
      {layout === "article" ? <ArticleBodySkeleton /> : null}
    </div>
  );
}
