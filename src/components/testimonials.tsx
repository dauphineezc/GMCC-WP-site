import { mediaFocalPositionCss, type MediaFocalPointFields } from "@/lib/mediaFocalPoint";

type GqlImage = {
  node?: ({ sourceUrl?: string | null; altText?: string | null } & MediaFocalPointFields) | null;
};

export type NormalizedTestimonial = {
    id: string;
    quote: string;
    personName: string;
    personContext: string;
    photoUrl: string | null;
    photoAlt: string;
    photoObjectPosition?: string;
};

type WpGraphqlTestimonialNode = {
    id: string;
    title?: string | null;
    testimonialFields?: {
        quote?: string | null;
        personName?: string | null;
        personContext?: string | null;
        photo?: GqlImage | null;
    } | null;
};

type FlatTestimonialInput = {
    id: string;
    quote?: string | null;
    personName?: string | null;
    personContext?: string | null;
    photoUrl?: string | null;
    photoAlt?: string | null;
    photoObjectPosition?: string | null;
};

export type TestimonialInput = FlatTestimonialInput | WpGraphqlTestimonialNode;

function isWpGraphqlTestimonialNode(t: TestimonialInput): t is WpGraphqlTestimonialNode {
    return "testimonialFields" in t;
}

export function normalizeTestimonials(
    testimonials: Array<TestimonialInput | null | undefined>
): NormalizedTestimonial[] {
    return testimonials
        .filter((t): t is TestimonialInput => Boolean(t))
        .map((t) => {
            const hasWpFields = isWpGraphqlTestimonialNode(t);
            const quote = hasWpFields ? t.testimonialFields?.quote ?? "" : t.quote ?? "";
            const personName = hasWpFields
                ? t.testimonialFields?.personName ?? t.title ?? ""
                : t.personName ?? "";
            const personContext = hasWpFields ? t.testimonialFields?.personContext ?? "" : t.personContext ?? "";
            const photoNode = hasWpFields ? t.testimonialFields?.photo?.node : null;
            const photoUrl = hasWpFields
                ? photoNode?.sourceUrl ?? null
                : t.photoUrl ?? null;
            const photoAlt = hasWpFields
                ? photoNode?.altText ?? ""
                : t.photoAlt ?? "";
            const photoObjectPosition = hasWpFields
                ? mediaFocalPositionCss(photoNode)
                : t.photoObjectPosition ?? undefined;

            return {
                id: t.id,
                quote,
                personName,
                personContext,
                photoUrl,
                photoAlt,
                ...(photoObjectPosition ? { photoObjectPosition } : {}),
            };
        });
}

export function TestimonialSection({ testimonials }: { testimonials: NormalizedTestimonial[] }) {
    return (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
            {testimonials.map((t) => (
                <div key={t.id} className="card p-8">
                    <div className="text-sm leading-relaxed text-neutral-700">{t.quote}</div>
                    <div className="flex items-center justify-start gap-3 mt-4">
                        {t.photoUrl ? (
                            <img
                                src={t.photoUrl}
                                alt={t.photoAlt}
                                className="w-12 h-12 rounded-full object-cover"
                                style={
                                    t.photoObjectPosition
                                        ? { objectPosition: t.photoObjectPosition }
                                        : undefined
                                }
                            />
                        ) : null}
                        <div>
                            <div className="text-sm font-bold text-gmcc-navy">{t.personName}</div>
                            {t.personContext ? <div className="text-xs text-neutral-500">{t.personContext}</div> : null}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
