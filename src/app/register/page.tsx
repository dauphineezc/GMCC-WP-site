// src/app/register/page.tsx
import SolidNavyWaveHeader from "@/components/solidNavyWaveHeader";
import { splitLines } from "@/lib/acf";
import JotFormLightboxButton from "@/components/jotFormLightboxButton";
import { wpFetch } from "@/lib/wp";
import type { Metadata } from "next";

// ── 2. METADATA (optional but recommended) ──────────────────────────────────
export const metadata: Metadata = {
 title: "Register",
 description: "Sign up or log in for external registrations.",
};

const REGISTER_PAGE_QUERY = /* GraphQL */ `
  query RegisterPage($uri: ID!) {
    page(id: $uri, idType: URI) {
      id
      title
      slug

 registerPageFields {
   header
   subheader
   introductionHeader
   introductionBody

   webtracCard {
    header
    subheader
    description
    usesList
    primaryCtaLabel
    primaryCtaUrl
    secondaryCtaLabel
    secondaryCtaUrl
   }

   clubAutomationCard {
    header
    subheader
    description
    usesList
    primaryCtaLabel
    primaryCtaUrl
    secondaryCtaLabel
    secondaryCtaUrl
   }

   helpHeader
   helpBody
      }
    }
  }
`;

type RegisterCard = {
 header?: string | null;
 subheader?: string | null;
 description?: string | null;
 usesList?: string | null;
 primaryCtaLabel?: string | null;
 primaryCtaUrl?: string | null;
 secondaryCtaLabel?: string | null;
 secondaryCtaUrl?: string | null;
};

type RegisterPageFields = {
 header?: string | null;
 subheader?: string | null;
 introductionHeader?: string | null;
 introductionBody?: string | null;
 webtracCard?: RegisterCard | null;
 clubAutomationCard?: RegisterCard | null;
 helpHeader?: string | null;
 helpBody?: string | null;
};

type RegisterPageExtra = {
 registerPageFields?: RegisterPageFields | null;
};

export default async function RegisterPage() {
    const data = await wpFetch<any>(REGISTER_PAGE_QUERY, { uri: "/register" });
    const fields: RegisterPageFields | undefined = data?.page?.registerPageFields;
    const webtracCard = fields?.webtracCard;
    const clubAutomationCard = fields?.clubAutomationCard;
    const webtracUses = splitLines(webtracCard?.usesList);
    const clubAutomationUses = splitLines(clubAutomationCard?.usesList);

 return (
   <main>
     <SolidNavyWaveHeader title={fields?.header} description={fields?.subheader} />
     
     <section className="page-section stack-8">
       {fields?.introductionHeader ? (
         <h2 className="h2">{fields.introductionHeader}</h2>
       ) : null}
       {fields?.introductionBody ? (
         <p className="body whitespace-pre-line text-neutral-700">
           {fields.introductionBody}
         </p>
       ) : null}
       </section>

       <section className="page-section stack-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2">
         <div className="space-y-4 md:col-span-1 card bg-gmcc-blue-light/30 overflow-hidden p-8">
           {webtracCard?.header ? (
             <h2 className="h2">{webtracCard.header}</h2>
           ) : null}
           {webtracCard?.subheader ? (
             <h3 className="h3">{webtracCard.subheader}</h3>
           ) : null}
           {webtracCard?.description ? (
             <p className="body whitespace-pre-line text-neutral-700">
               {webtracCard.description}
             </p>
           ) : null}
           {webtracUses.length > 0 ? (
             <ul className="space-y-2 pl-6 mt-4">
             {webtracUses.map((item, i) => (
               <li key={i} className="flex items-center gap-2 text-base text-neutral-700">
                 <svg className="h-4 w-4 shrink-0 text-gmcc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                 </svg>
                 {item}
               </li>
             ))}
           </ul>
           ) : null}
           {webtracCard?.primaryCtaLabel ? (
             <a href={webtracCard.primaryCtaUrl ?? ""} className="btn btn-primary mr-2">
               {webtracCard.primaryCtaLabel}
             </a>
           ) : null}
           {webtracCard?.secondaryCtaLabel ? (
             <a href={webtracCard.secondaryCtaUrl ?? ""} className="btn btn-secondary">
               {webtracCard.secondaryCtaLabel}
             </a>
           ) : null}
        </div>

        <div className="space-y-4 md:col-span-1 card bg-gmcc-blue-light/30 overflow-hidden p-8">
        {clubAutomationCard?.header ? (
             <h2 className="h2">{clubAutomationCard.header}</h2>
           ) : null}
           {clubAutomationCard?.subheader ? (
             <h3 className="h3">{clubAutomationCard.subheader}</h3>
           ) : null}
           {clubAutomationCard?.description ? (
             <p className="body whitespace-pre-line text-neutral-700">
               {clubAutomationCard.description}
             </p>
           ) : null}
           {clubAutomationUses.length > 0 ? (
             <ul className="space-y-2 pl-6 mt-4">
             {clubAutomationUses.map((item, i) => (
               <li key={i} className="flex items-center gap-2 text-base text-neutral-700">
                 <svg className="h-4 w-4 shrink-0 text-gmcc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                 </svg>
                 {item}
               </li>
             ))}
           </ul>
           ) : null}
           {clubAutomationCard?.primaryCtaLabel ? (
             <a href={clubAutomationCard.primaryCtaUrl ?? ""} className="btn btn-primary mr-2">
               {clubAutomationCard.primaryCtaLabel}
             </a>
           ) : null}
           {clubAutomationCard?.secondaryCtaLabel ? (
             <a href={clubAutomationCard.secondaryCtaUrl ?? ""} className="btn btn-secondary">
               {clubAutomationCard.secondaryCtaLabel}
             </a>
           ) : null}
        </div>
        </div>
       </section>

       <section className="page-section text-center">
        {fields?.helpHeader ? (
            <h2 className="h2">{fields.helpHeader}</h2>
        ) : null}
        {fields?.helpBody ? (
            <p className="body whitespace-pre-line text-neutral-700 mt-4">
            {fields.helpBody}
            </p>
        ) : null}

        <div className="flex justify-center">
            <JotFormLightboxButton />
          </div>
       </section>
   </main>
 );
}