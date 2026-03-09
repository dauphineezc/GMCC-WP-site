"use client";

import React, { useEffect, useRef, useState } from "react";

type Maybe<T> = T | null | undefined;

export type ACFFile = {
  sourceUrl?: Maybe<string>;
  mediaItemUrl?: Maybe<string>;
  title?: Maybe<string>;
};

export type DirectoryAttachment = {
  label?: Maybe<string>;
  file?: Maybe<ACFFile>;
};

export type DirectoryTrainer = {
  name?: Maybe<string>;
  photo?: Maybe<{
    sourceUrl?: Maybe<string>;
    altText?: Maybe<string>;
  }>;
  jobTitle?: Maybe<string>;
  bio?: Maybe<string>;
};

export type DirectoryHeaderData = {
  header?: Maybe<string>;
  body?: Maybe<string>;
  attachments?: Maybe<{
    attachment1?: Maybe<DirectoryAttachment>;
    attachment2?: Maybe<DirectoryAttachment>;
    attachment3?: Maybe<DirectoryAttachment>;
    attachment4?: Maybe<DirectoryAttachment>;
  }>;
  trainers?: Maybe<DirectoryTrainer[]>;
};

function fileUrl(file: Maybe<ACFFile>) {
  return file?.sourceUrl ?? file?.mediaItemUrl ?? undefined;
}

function normalizeAttachments(
  attachments: Maybe<DirectoryHeaderData["attachments"]>
): Array<DirectoryAttachment & { key: string }> {
  if (!attachments) return [];
  const items: Array<[string, Maybe<DirectoryAttachment>]> = [
    ["attachment1", attachments.attachment1],
    ["attachment2", attachments.attachment2],
    ["attachment3", attachments.attachment3],
    ["attachment4", attachments.attachment4],
  ];

  return items
    .filter(([, att]) => !!att?.label || !!fileUrl(att?.file))
    .map(([key, att]) => ({ key, ...(att ?? {}) }));
}

export function DirectoryHeaderShell({
  data,
  className = "",
}: {
  data: Maybe<DirectoryHeaderData>;
  className?: string;
}) {
  const [selectedTrainer, setSelectedTrainer] = useState<DirectoryTrainer | null>(null);
  const [activeTrainerIndex, setActiveTrainerIndex] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [isMd, setIsMd] = useState(false);
  const trainersRowRef = useRef<HTMLDivElement | null>(null);
  const trainerCardRefs = useRef<Array<HTMLElement | null>>([]);
  const isProgrammaticScroll = useRef(false);
  const safeData = data ?? {};

  const header = (safeData.header ?? "").trim();
  const body = (safeData.body ?? "").trim();
  const attachments = normalizeAttachments(safeData.attachments);
  const trainers = (safeData.trainers ?? []).filter(
    (trainer) => !!trainer?.name || !!trainer?.jobTitle || !!trainer?.photo?.sourceUrl
  );

  const DESKTOP_COLS = 4;
  const COL_GAP_PX = 16;
  const EDGE_PAD_PX = 6;

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsMd(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  const getSnapPositions = () =>
    trainerCardRefs.current
      .map((el) => (el ? el.offsetLeft : null))
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);

  const getMaxIndex = (n: number) => {
    if (n <= 0) return 0;
    if (!isMd) return n - 1;
    return Math.max(0, n - DESKTOP_COLS);
  };

  const getMaxReachableIndex = (scroller: HTMLDivElement, positions: number[]) => {
    const epsilon = isMd ? 4 : 10;
    const maxScrollLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    let reachable = 0;
    for (let i = 0; i < positions.length; i++) {
      if (positions[i] <= maxScrollLeft + epsilon) reachable = i;
    }
    return Math.min(reachable, getMaxIndex(positions.length));
  };

  const syncEdgeAndActive = () => {
    const scroller = trainersRowRef.current;
    if (!scroller) return;

    const positions = getSnapPositions();
    if (!positions.length) return;

    const epsilon = isMd ? 4 : 10;
    const current = scroller.scrollLeft;
    let bestIdx = 0;
    let bestDist = Number.POSITIVE_INFINITY;

    for (let i = 0; i < positions.length; i++) {
      const dist = Math.abs(positions[i] - current);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    const maxIdx = getMaxReachableIndex(scroller, positions);
    const clampedIdx = Math.max(0, Math.min(bestIdx, maxIdx));

    setActiveTrainerIndex(clampedIdx);
    setAtStart(clampedIdx === 0);
    setAtEnd(
      maxIdx === 0 ||
        Math.abs(current - positions[maxIdx]) <= epsilon ||
        clampedIdx === maxIdx
    );
  };

  useEffect(() => {
    const scroller = trainersRowRef.current;
    if (!scroller) return;

    const onScroll = () => {
      if (!isProgrammaticScroll.current) syncEdgeAndActive();
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    syncEdgeAndActive();

    return () => scroller.removeEventListener("scroll", onScroll);
  }, [trainers.length, isMd]);

  const scrollToTrainer = (index: number) => {
    const scroller = trainersRowRef.current;
    if (!scroller) return;

    const positions = getSnapPositions();
    if (!positions.length) return;

    const maxIdx = getMaxReachableIndex(scroller, positions);
    const targetIndex = Math.max(0, Math.min(index, maxIdx));
    const maxScrollLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    const targetLeft = Math.max(0, Math.min(positions[targetIndex], maxScrollLeft));

    setActiveTrainerIndex(targetIndex);
    isProgrammaticScroll.current = true;
    scroller.scrollTo({ left: targetLeft, behavior: "smooth" });
    window.setTimeout(() => {
      isProgrammaticScroll.current = false;
      syncEdgeAndActive();
    }, 450);
  };

  const goPrev = () => scrollToTrainer(activeTrainerIndex - 1);
  const goNext = () => scrollToTrainer(activeTrainerIndex + 1);

  if (!header && !body && attachments.length === 0 && trainers.length === 0) return null;

  return (
    <section
      aria-label={header ? `${header} information` : "Directory information"}
      className={`w-full ${className}`}
    >
      <div className="bg-white stack-4">
        {header ? <h1 className="h1">{header}</h1> : null}
        {body ? <div className="body whitespace-pre-line">{body}</div> : null}

        {trainers.length ? (
          <div className="pt-2">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="eyebrow">Meet the trainers</h3>
              {trainers.length > 1 ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={goPrev}
                    disabled={atStart}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gmcc-navy bg-gmcc-navy text-white body disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gmcc-navy/80"
                    aria-label="Scroll trainers left"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={atEnd}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gmcc-navy bg-gmcc-navy text-white body disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gmcc-navy/80"
                    aria-label="Scroll trainers right"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              ) : null}
            </div>

            <div
              ref={trainersRowRef}
              className="w-full min-w-0 max-w-full overflow-x-auto pb-1 pt-1 px-[6px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              style={{
                scrollSnapType: "x mandatory",
                WebkitOverflowScrolling: "touch",
                scrollPaddingLeft: EDGE_PAD_PX,
                scrollPaddingRight: EDGE_PAD_PX,
              }}
            >
              <div
                className="grid gap-4"
                style={{
                  gridAutoFlow: "column",
                  gridAutoColumns: isMd
                    ? `calc((100% - ${COL_GAP_PX * (DESKTOP_COLS - 1)}px) / ${DESKTOP_COLS})`
                    : "100%",
                  width: "max-content",
                  minWidth: "100%",
                }}
              >
                {trainers.map((trainer, index) => (
                  <div
                    key={`${trainer.name ?? "trainer"}-${index}`}
                    ref={(el) => {
                      trainerCardRefs.current[index] = el;
                    }}
                    style={{
                      scrollSnapAlign: "start",
                      scrollSnapStop: "always",
                    }}
                  >
                    <article className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                      <div className="relative h-60 w-full bg-neutral-100">
                        {trainer.photo?.sourceUrl ? (
                          <img
                            src={trainer.photo.sourceUrl}
                            alt={trainer.photo.altText ?? trainer.name ?? "Trainer"}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : null}
                      </div>
                      <div className="p-4">
                        {trainer.name ? (
                          <div className="text-base font-semibold text-gmcc-navy">{trainer.name}</div>
                        ) : null}
                        {trainer.jobTitle ? (
                          <div className="mt-0.5 text-sm text-neutral-600">{trainer.jobTitle}</div>
                        ) : null}
                        {trainer.bio ? (
                          <button
                            type="button"
                            onClick={() => setSelectedTrainer(trainer)}
                            className="mt-3 text-xs font-medium text-gmcc-teal hover:underline"
                          >
                            Read bio
                          </button>
                        ) : null}
                      </div>
                    </article>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {attachments.length ? (
          <div className="pt-2">
            <h3 className="eyebrow mb-3">Relevant documents</h3>
            <ul className="flex flex-wrap gap-3">
              {attachments.map((att) => {
                const url = fileUrl(att.file);
                if (!url) return null;
                const label = (att.label ?? att.file?.title ?? "Download").trim();

                return (
                  <li key={att.key}>
                    <a
                      href={url}
                      className="group flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 transition-all hover:border-gmcc-teal hover:bg-white hover:shadow-md"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gmcc-teal/10 text-gmcc-teal">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 3v6h6" />
                        </svg>
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium text-neutral-800 group-hover:text-gmcc-navy">
                          {label}
                        </span>
                        <span className="text-xs text-neutral-500">PDF • Click to download</span>
                      </div>
                      <svg className="ml-2 h-4 w-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-y-0.5 group-hover:text-gmcc-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>

      {selectedTrainer && selectedTrainer.bio ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedTrainer(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white shadow-xl md:grid md:grid-cols-[40%_60%]"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedTrainer.photo?.sourceUrl ? (
              <img
                src={selectedTrainer.photo.sourceUrl}
                alt={selectedTrainer.photo.altText ?? selectedTrainer.name ?? "Trainer"}
                className="h-56 w-full object-cover object-top md:h-full md:min-h-[360px] md:object-contain md:bg-neutral-100"
              />
            ) : null}
            <div className="p-6">
              {selectedTrainer.name ? (
                <h3 className="text-xl font-semibold text-neutral-900">{selectedTrainer.name}</h3>
              ) : null}
              {selectedTrainer.jobTitle ? (
                <p className="mt-1 text-sm text-neutral-600">{selectedTrainer.jobTitle}</p>
              ) : null}
              <p className="mt-4 whitespace-pre-line text-sm text-neutral-700">{selectedTrainer.bio}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTrainer(null)}
              className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 shadow-md transition-colors hover:bg-white"
              aria-label="Close trainer bio"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
