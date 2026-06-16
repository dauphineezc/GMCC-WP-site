import PhoneLink from "@/components/phoneLink";

type RegistrationInformation = {
  instructionalSubheader?: string | null;
  registrationLink?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
} | null | undefined;

type LabeledLink = { linkLabel?: string | null; link?: string | null } | null | undefined;

type AdditionalInformationLinks = {
  link1?: LabeledLink;
  link2?: LabeledLink;
  link3?: LabeledLink;
} | null | undefined;

/**
 * "Ready to register?" sticky sidebar shared by the program and event detail
 * pages: registration CTA / phone / email plus an optional "Need more
 * information?" link list.
 */
export default function RegistrationSidebar({
  registrationInformation,
  additionalInformationLinks,
}: {
  registrationInformation: RegistrationInformation;
  additionalInformationLinks: AdditionalInformationLinks;
}) {
  const reg = registrationInformation ?? {};
  const { link1, link2, link3 } = additionalInformationLinks ?? {};
  const links = [link1, link2, link3].filter(
    (l): l is { linkLabel: string; link: string } => !!l?.link && !!l?.linkLabel,
  );

  return (
    <aside className="card h-fit sticky top-18 z-10 w-full min-w-0 shrink-0 border-gmcc-teal/40 bg-gmcc-blue-light/30 p-6">
      <h2 className="h2 text-gmcc-navy">Ready to register?</h2>
      <p className="mt-2 small mb-2">{reg.instructionalSubheader}</p>

      {reg.registrationLink || reg.phoneNumber || reg.email ? (
        <>
          {reg.registrationLink && (
            <a
              className="btn btn-primary w-full mt-4 mb-4"
              href={reg.registrationLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Register now
            </a>
          )}
          {reg.phoneNumber && (
            <PhoneLink
              className="mt-4 small text-gmcc-teal font-bold hover:text-gmcc-navy hover:underline"
              phone={reg.phoneNumber}
            />
          )}
          <br />
          {reg.email && (
            <a
              href={`mailto:${reg.email}`}
              className="mt-4 small text-gmcc-teal font-bold hover:text-gmcc-navy hover:underline"
            >
              {reg.email}
            </a>
          )}
        </>
      ) : (
        <p className="mt-4 small">Registration details will be posted soon.</p>
      )}

      {links.length > 0 && (
        <div className="mt-4">
          <h2 className="h3">Need more information?</h2>
          <ul className="text-sm mt-2">
            {links.map((link, i) => (
              <li key={i}>
                <a href={link.link} className="link body block text-sm">
                  ➜ {link.linkLabel}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
