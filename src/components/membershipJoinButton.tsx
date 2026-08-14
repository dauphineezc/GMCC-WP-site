// components/membershipJoinButton.tsx

"use client";

import { useState } from "react";
import { WEBTRAC_REGISTRATION_URL } from "@/lib/constants";

export type MembershipPayLink = {
  url: string;
  label: string;
  target: string | null;
};

export type MembershipJoinLinks = {
  slug: string;
  autoDraftLink?: MembershipPayLink | null;
  manualPayLink?: MembershipPayLink | null;
};

const DEFAULT_JOIN_URL = WEBTRAC_REGISTRATION_URL;

export function resolveJoinAction(
  membership: MembershipJoinLinks
): "modal" | "direct" {
  const hasAuto = Boolean(membership.autoDraftLink?.url);
  const hasManual = Boolean(membership.manualPayLink?.url);
  if (hasAuto && hasManual) return "modal";
  return "direct";
}

export function resolveDirectJoinUrl(membership: MembershipJoinLinks): string {
  return (
    membership.autoDraftLink?.url ??
    membership.manualPayLink?.url ??
    DEFAULT_JOIN_URL
  );
}

type Props = {
  membership: MembershipJoinLinks;
  /** Name shown inside the auto draft / manual pay chooser */
  planName: string;
  label?: string;
  buttonClassName?: string;
  wrapperClassName?: string;
  /** Lets the card lift its stacking context / unclip overflow while the chooser is open */
  onOpenChange?: (open: boolean) => void;
};

export default function MembershipJoinButton({
  membership,
  planName,
  label = "Join Now",
  buttonClassName = "btn btn-primary w-full",
  wrapperClassName = "",
  onOpenChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const joinAction = resolveJoinAction(membership);

  const setChoiceOpen = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  return (
    <div className={`relative ${open ? "z-50 " : ""}${wrapperClassName}`}>
      {open && joinAction === "modal" && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/15"
            onClick={() => setChoiceOpen(false)}
            aria-hidden
          />
          <div
            className="absolute bottom-full left-0 right-0 z-50 mb-2 rounded-xl border border-neutral-200 bg-white p-4 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`join-choice-title-${membership.slug}`}
          >
            <div className="flex items-start justify-between gap-2">
              <h3
                id={`join-choice-title-${membership.slug}`}
                className="text-base font-semibold text-gmcc-navy"
              >
                Choose how to pay
              </h3>
              <button
                type="button"
                onClick={() => setChoiceOpen(false)}
                className="shrink-0 rounded-full bg-neutral-100 p-1 text-neutral-600 transition hover:bg-neutral-200"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="mt-1 text-xs text-neutral-600">
              Continue registration for{" "}
              <span className="font-semibold text-gmcc-navy">{planName}</span>
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {membership.autoDraftLink ? (
                <a
                  href={membership.autoDraftLink.url}
                  target={membership.autoDraftLink.target ?? "_blank"}
                  rel="noopener noreferrer"
                  className="btn btn-primary w-full text-sm"
                >
                  {membership.autoDraftLink.label}
                </a>
              ) : null}
              {membership.manualPayLink ? (
                <a
                  href={membership.manualPayLink.url}
                  target={membership.manualPayLink.target ?? "_blank"}
                  rel="noopener noreferrer"
                  className="btn btn-secondary w-full text-sm"
                >
                  {membership.manualPayLink.label}
                </a>
              ) : null}
            </div>
          </div>
        </>
      )}

      {joinAction === "modal" ? (
        <button
          type="button"
          onClick={() => setChoiceOpen(true)}
          className={buttonClassName}
        >
          {label}
        </button>
      ) : (
        <a
          href={resolveDirectJoinUrl(membership)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClassName}
        >
          {label}
        </a>
      )}
    </div>
  );
}
