import {
  type DropInCareFields,
  type DropInTextCard,
  dropInTextCardHasContent,
  openLinkInNewTab,
} from "@/lib/dropInCareFields";

function DropInCard({
  title,
  body,
  icon,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  body: string;
  icon: { src: string; alt: string };
  ctaLabel: string;
  ctaHref: string;
}) {
  if (!dropInTextCardHasContent({ header: title, body, ctaLabel, ctaHref, icon })) return null;

  return (
    <div className="relative card card-hover bg-gmcc-blue-light/30 stack-4 flex flex-col overflow-hidden p-8">
      {icon.src ? (
        <img
          src={icon.src}
          alt={icon.alt}
          aria-hidden
          className="pointer-events-none absolute left-4 top-4 h-14 w-14"
        />
      ) : null}
      <h3 className="h2 text-center mb-2 pt-4">{title}</h3>
      {body ? (
        <p className="body mt-2 leading-6 text-neutral-700 text-center">{body}</p>
      ) : null}
      {ctaHref && ctaLabel ? (
        <a
          href={ctaHref}
          className="btn btn-primary mx-auto"
          {...(openLinkInNewTab(ctaHref) ? { target: "_blank" as const, rel: "noopener noreferrer" as const } : {})}
        >
          {ctaLabel}
        </a>
      ) : null}
    </div>
  );
}

export function DropInCareSection({
  fields,
  className = "",
  /** Apply page-level max-width/padding (e.g. early-childhood). Omit when parent already constrains layout. */
  contain = false,
}: {
  fields: DropInCareFields;
  className?: string;
  contain?: boolean;
}) {
  const showChildwatch = dropInTextCardHasContent(fields.childwatchCard);
  const showTheZone = dropInTextCardHasContent(fields.theZoneCard);
  const hasCards = showChildwatch || showTheZone;
  const hasSection =
    Boolean(fields.dropInCareHeader || fields.dropInCareDescription) || hasCards;

  if (!hasSection) return null;

  const layoutClass = contain ? "mx-auto max-w-6xl px-6" : "w-full";

  return (
    <section className={`${layoutClass} section-y py-8 ${className}`.trim()}>
      {fields.dropInCareHeader ? <h2 className="h2">{fields.dropInCareHeader}</h2> : null}
      {fields.dropInCareDescription ? (
        <p className="body mt-2 whitespace-pre-line text-neutral-700 mb-8">
          {fields.dropInCareDescription}
        </p>
      ) : null}
      {hasCards ? (
        <div className="grid gap-6 md:grid-cols-2">
          {showChildwatch ? (
            <DropInCard
              title={fields.childwatchCard.header || "Childwatch"}
              body={fields.childwatchCard.body}
              icon={fields.childwatchCard.icon}
              ctaLabel={fields.childwatchCard.ctaLabel}
              ctaHref={fields.childwatchCard.ctaHref}
            />
          ) : null}
          {showTheZone ? (
            <DropInCard
              title={fields.theZoneCard.header || "The Zone"}
              body={fields.theZoneCard.body}
              icon={fields.theZoneCard.icon}
              ctaLabel={fields.theZoneCard.ctaLabel}
              ctaHref={fields.theZoneCard.ctaHref}
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
