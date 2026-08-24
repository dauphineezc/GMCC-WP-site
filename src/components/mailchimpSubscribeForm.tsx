const AUDIENCES = {
  greaterLife: {
    action:
      "https://greatermidland.us4.list-manage.com/subscribe/post?u=895ea5254c3627bd89b7156c5&id=ae592b2fe1&f_id=009b0ce3f0",
    honeypot: "b_895ea5254c3627bd89b7156c5_ae592b2fe1",
  },
  tennis: {
    action:
      "https://greatermidland.us4.list-manage.com/subscribe/post?u=895ea5254c3627bd89b7156c5&id=4ab80043ad&f_id=009a0ce3f0",
    honeypot: "b_895ea5254c3627bd89b7156c5_4ab80043ad",
  },
} as const;

export type MailchimpAudience = keyof typeof AUDIENCES;

/** Map center page slugs to a Mailchimp audience; everything else uses greaterLife. */
export function audienceForCenterSlug(slug: string): MailchimpAudience {
  if (slug === "tennis-center") return "tennis";
  return "greaterLife";
}

type MailchimpSubscribeFormProps = {
  idPrefix: string;
  inputClassName: string;
  buttonClassName?: string;
  audience?: MailchimpAudience;
};

export default function MailchimpSubscribeForm({
  idPrefix,
  inputClassName,
  buttonClassName = "btn btn-secondary",
  audience = "greaterLife",
}: MailchimpSubscribeFormProps) {
  const emailId = `${idPrefix}-EMAIL`;
  const { action, honeypot } = AUDIENCES[audience];

  return (
    <form
      action={action}
      method="post"
      target="_self"
      noValidate
      aria-label="Newsletter signup"
    >
      <div className="space-y-3">
        <label htmlFor={emailId} className="sr-only">
          Email Address
        </label>
        <input
          type="email"
          name="EMAIL"
          id={emailId}
          required
          autoComplete="email"
          placeholder="Enter your email address"
          className={inputClassName}
        />
        <div aria-hidden="true" className="absolute left-[-5000px]">
          <input type="text" name={honeypot} tabIndex={-1} defaultValue="" />
        </div>
        <div className="flex justify-center">
          <button type="submit" name="subscribe" className={buttonClassName}>
            Subscribe
          </button>
        </div>
      </div>
    </form>
  );
}
