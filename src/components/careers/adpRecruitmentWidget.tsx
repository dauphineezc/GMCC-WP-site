"use client";

import Script from "next/script";
import { createElement, useState } from "react";

const ADP_RECRUITMENT_SCRIPT =
  "https://workforcenow.adp.com/mascsr/default/mdf/recwebcomponents/recruitment/main-config/recruitment.js";

type AdpRecruitmentWidgetProps = {
  cid?: string;
  ccid?: string;
  host?: string;
  locale?: string;
};

export default function AdpRecruitmentWidget({
  cid = "606be4f4-ba50-47f5-948f-eceb47f16218",
  ccid = "19000101_000003",
  host = "DP",
  locale = "en_US",
}: AdpRecruitmentWidgetProps) {
  const [scriptReady, setScriptReady] = useState(false);

  return (
    <div className="adp-recruitment-widget mt-6 min-h-[12rem]">
      <Script
        src={ADP_RECRUITMENT_SCRIPT}
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      {scriptReady ? (
        createElement("recruitment-current-openings", { cid, ccid, host, locale })
      ) : (
        <p className="body text-neutral-600">Loading current openings…</p>
      )}
    </div>
  );
}
