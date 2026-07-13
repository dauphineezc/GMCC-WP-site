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

export type DirectorySponsor = {
  name?: Maybe<string>;
  logoUrl?: Maybe<string>;
  logoAlt?: Maybe<string>;
  link?: Maybe<string>;
  tier?: Maybe<string>;
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
  sponsors?: Maybe<DirectorySponsor[]>;
  trainers?: Maybe<DirectoryTrainer[]>;
  redirectLabel?: Maybe<string>;
  redirectUrl?: Maybe<string>;
};

function fileUrl(file: Maybe<ACFFile>) {
  return file?.mediaItemUrl ?? file?.sourceUrl ?? undefined;
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
  const safeData = data ?? {};
  const header = (safeData.header ?? "").trim();
  const body = (safeData.body ?? "").trim();
  const attachments = normalizeAttachments(safeData.attachments);
  const redirectLabel = safeData.redirectLabel ?? "";
  const redirectUrl = safeData.redirectUrl ?? "";

  return (
    <section
      aria-label={header ? `${header} information` : "Directory information"}
      className={`w-full ${className}`}
    >
      <div className="bg-white stack-4">
        {header ? <h1 className="h1">{header}</h1> : null}
        {body ? <div className="body whitespace-pre-line">{body}</div> : null}
        {redirectLabel && redirectUrl ? <a href={redirectUrl} className="text-sm font-semibold text-gmcc-teal hover:text-gmcc-navy block pb-2">{redirectLabel}</a> : null}

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
    </section>
  );
}
