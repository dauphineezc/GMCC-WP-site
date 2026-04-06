import ImageCarousel from "@/components/imageCarousel";

type AdvantageProShopSectionProps = {
  advantageProShopFields?: {
    contactInformation?: {
      phone?: string | null;
      email?: string | null;
      pointOfContactName?: string | null;
    } | null;
    hours?: {
      mondayHours?: string | null;
      tuesdayHours?: string | null;
      wednesdayHours?: string | null;
      thursdayHours?: string | null;
      fridayHours?: string | null;
      saturdayHours?: string | null;
      sundayHours?: string | null;
    } | null;
    gallery?: {
      photo1?: { node?: { sourceUrl?: string | null; altText?: string | null } | null } | null;
      photo2?: { node?: { sourceUrl?: string | null; altText?: string | null } | null } | null;
      photo3?: { node?: { sourceUrl?: string | null; altText?: string | null } | null } | null;
      photo4?: { node?: { sourceUrl?: string | null; altText?: string | null } | null } | null;
      photo5?: { node?: { sourceUrl?: string | null; altText?: string | null } | null } | null;
    } | null;
  } | null;
};

export default function AdvantageProShopSection({
  advantageProShopFields,
}: AdvantageProShopSectionProps) {
  const contact = advantageProShopFields?.contactInformation ?? null;
  const contactRows = [
    { label: "Contact", value: contact?.pointOfContactName?.trim() ?? "" },
    { label: "Phone", value: contact?.phone?.trim() ?? "" },
    { label: "Email", value: contact?.email?.trim() ?? "" },
  ].filter((row) => Boolean(row.value));

  const hours = advantageProShopFields?.hours ?? null;
  const weeklyHours = [
    { day: "Monday", value: hours?.mondayHours ?? null },
    { day: "Tuesday", value: hours?.tuesdayHours ?? null },
    { day: "Wednesday", value: hours?.wednesdayHours ?? null },
    { day: "Thursday", value: hours?.thursdayHours ?? null },
    { day: "Friday", value: hours?.fridayHours ?? null },
    { day: "Saturday", value: hours?.saturdayHours ?? null },
    { day: "Sunday", value: hours?.sundayHours ?? null },
  ]
    .map(({ day, value }) => {
      return { day, value };
    })
    .filter((row) => Boolean(row.value));

  const gallery = advantageProShopFields?.gallery ?? null;
  const galleryImages = [gallery?.photo1, gallery?.photo2, gallery?.photo3, gallery?.photo4, gallery?.photo5]
    .map((photo) => {
      const sourceUrl = photo?.node?.sourceUrl ?? null;
      if (!sourceUrl) return null;
      return {
        image: {
          sourceUrl,
          altText: photo?.node?.altText ?? null,
        },
        cta: null,
        url: null,
      };
    })
    .filter((item): item is { image: { sourceUrl: string; altText: string | null }; cta: null; url: null } =>
      Boolean(item)
    );

  const hasHours = weeklyHours.length > 0;
  const hasGallery = galleryImages.length > 0;
  const hasContact = contactRows.length > 0;

  if (!hasContact && !hasHours && !hasGallery) return null;

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,2fr)]">
      {/* LEFT COLUMN: Gallery */}
      {hasGallery ? (
        <section className="stack-4">
          <ImageCarousel images={galleryImages} />
        </section>
      ) : null}

      {/* RIGHT COLUMN: Hours and Contact Information*/}
      <div className="stack-4">
        {hasHours ? (
          <section className="stack-4 mb-8">
            <h2 className="h2">Hours</h2>
            <div className="overflow-hidden rounded-lg">
              <table className="w-full table-fixed text-left">
                <tbody>
                  {weeklyHours.map((row, idx) => (
                    <tr
                      key={row.day}
                    >
                      <th className="w-1/3 px-4 py-2 font-semibold text-neutral-700 uppercase text-sm">
                        {row.day}
                      </th>
                      <td className="px-4 text-neutral-700">{row.value ?? "Closed"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
        
        {hasContact ? (
          <section className="stack-4 mb-8">
            <h2 className="h2">Contact Information</h2>
              <dl className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
                {contactRows.map((row) => (
                  <div key={row.label} className="contents">
                    <dt className="px-4 font-semibold text-neutral-700 uppercase text-sm">
                      {row.label}
                    </dt>
                    <dd className="body text-neutral-700">{row.value}</dd>
                  </div>
                ))}
              </dl>
          </section>
        ) : null}
      </div>
    </div>
  );
}
