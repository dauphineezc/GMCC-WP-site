import { wpFetch } from "@/lib/wp";
import SolidNavyWaveHeader from "@/components/solidNavyWaveHeader";
import PhoneLink from "@/components/phoneLink";

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-gmcc-teal" aria-hidden="true">
      <path
        d="M12 22c-4.2-4.9-7-8.3-7-12a7 7 0 1 1 14 0c0 3.7-2.8 7.1-7 12Zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-gmcc-teal" aria-hidden="true">
      <path
        d="M7.6 2h3.1c.6 0 1.1.4 1.2 1l.7 3.2c.1.5-.1 1-.5 1.3L10 9.5a14.4 14.4 0 0 0 4.5 4.5l2-2.1c.3-.4.8-.6 1.3-.5l3.2.7c.6.1 1 .6 1 1.2v3.1c0 .7-.6 1.3-1.3 1.3C11.6 18 6 12.4 6.3 3.3 6.3 2.6 6.9 2 7.6 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

const TAKE_A_TOUR_PAGE_QUERY = /* GraphQL */ `
  query TakeATourPage($uri: ID!) {
    page(id: $uri, idType: URI) {
      id
      title
      slug
      takeATourPageFields {
        header
        subheader
        tourDescription
      }
    }
  }
`;

export default async function TakeATourPage() {
  const data = await wpFetch<any>(TAKE_A_TOUR_PAGE_QUERY, { uri: "/take-a-tour" });
  const f = data?.page?.takeATourPageFields;

  const centerOrder = [
    "community center",
    "tennis center",
    "coleman family center",
    "north family center",
    "curling center",
  ];

  return (
    <main className="pb-16">
      <SolidNavyWaveHeader title={f?.header} description={f?.subheader} />

      <section className="mx-auto mt-8 max-w-6xl px-6 stack-2">
        <h2 className="mt-8 text-center text-xl font-extrabold text-gmcc-navy md:text-left md:text-2xl">
          Schedule a tour using the form below
        </h2>
        <p className="mb-4 text-center text-lg text-neutral-700 md:text-left">{f?.tourDescription}</p>
      </section>

      {/* Placeholder contact form (visual only) */}
      <div className="relative mt-8 overflow-hidden pb-8">
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-25">
            <img
              src="/GreaterLogoBG.png"
              alt=""
              className="absolute left-10 bottom-0 w-58 select-none md:w-80"
              draggable={false}
            />
            <img
              src="/GreaterLogoBG.png"
              alt=""
              className="absolute right-10 top-0 w-58 select-none md:w-80"
              draggable={false}
            />
          </div>

        <div className="mx-auto max-w-6xl px-10">
          <div className="relative mx-auto w-full rounded-2xl border border-neutral-300 bg-neutral-100 p-10 shadow-sm lg:w-[calc((3*(100%-4rem))/5+2rem)]">

            <form className="mt-4 space-y-4" aria-label="Placeholder contact form">
              <div>
                <label htmlFor="contact-name" className="block text-sm text-neutral-700">
                  Name
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  placeholder=""
                  className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm outline-none focus:border-gmcc-teal"
                />
              </div>

              <div>
                <label htmlFor="contact-email" className="block text-sm text-neutral-700">
                  Email address
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  placeholder=""
                  className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm outline-none focus:border-gmcc-teal"
                />
              </div>

              <div>
                <label htmlFor="contact-center" className="block text-sm text-neutral-700">
                  Which center are you interested in touring?
                </label>
                <select
                  id="contact-center"
                  name="center"
                  defaultValue=""
                  className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm outline-none focus:border-gmcc-teal"
                >
                  <option value="" disabled>
                    Select a center
                  </option>
                  {centerOrder.map((center) => (
                    <option key={center} value={center}>
                      {center
                        .split(" ")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="contact-date" className="block text-sm text-neutral-700">
                  What days do you prefer?
                </label>
                <details
                  id="contact-date"
                  className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-700"
                >
                  <summary className="cursor-pointer list-none py-1 text-neutral-500">
                    Select preferred days
                  </summary>
                  <div className="mt-2 space-y-2 pb-1">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                      <label key={day} className="flex items-center gap-2">
                        <input type="checkbox" name="date" value={day} className="h-4 w-4 accent-gmcc-teal" />
                        <span>{day}</span>
                      </label>
                    ))}
                  </div>
                </details>
              </div>

              <div>
                <label htmlFor="contact-time" className="block text-sm text-neutral-700">
                  What time of day do you prefer?
                </label>
                <details
                  id="contact-time"
                  className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-700"
                >
                  <summary className="cursor-pointer list-none py-1 text-neutral-500">
                    Select preferred times
                  </summary>
                  <div className="mt-2 space-y-2 pb-1">
                    {["Morning", "Afternoon", "Evening"].map((time) => (
                      <label key={time} className="flex items-center gap-2">
                        <input type="checkbox" name="time" value={time} className="h-4 w-4 accent-gmcc-teal" />
                        <span>{time}</span>
                      </label>
                    ))}
                  </div>
                </details>
              </div>
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-sm text-neutral-700">
                  Additional Information <span className="text-neutral-500 text-xs">(optional)</span>
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={5}
                  className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm outline-none focus:border-gmcc-teal"
                />
              </div>

              <div className="pt-1 text-center">
                <button type="button" className="btn btn-primary min-w-28">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* </section> */}
    </main>
  );
}