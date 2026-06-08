import Link from "next/link";
import PhotoWaveHeader from "@/components/photoWaveHeader";
import Accordion from "@/components/accordion";

// ─── Section 1 data ──────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: "exercise",
    icon: "🏋️",
    title: "Exercise & Fitness",
    description: "Work out your way — solo, in a class, or in the water.",
    color: "bg-gmcc-navy",
    subcategories: [
      { label: "Group Fitness", href: "/visit/group-fitness-schedules" },
      { label: "Gyms & Weight Rooms", href: "/amenities/fitness-center" },
      { label: "Pool Lap Swim", href: "/visit/pool-availability" },
    ],
  },
  {
    id: "sports",
    icon: "🎾",
    title: "Sports & Recreation",
    description: "Hit the courts, join a league, or drop in for a game.",
    color: "bg-gmcc-teal-dark",
    subcategories: [
      { label: "Basketball", href: "/visit/court-availability" },
      { label: "Tennis", href: "/visit/court-availability" },
      { label: "Pickleball", href: "/visit/court-availability" },
      { label: "Leagues", href: "/visit/league-schedules" },
    ],
  },
  {
    id: "family",
    icon: "👨‍👩‍👧‍👦",
    title: "Family Activities",
    description: "Something for every age, from toddlers to teens.",
    color: "bg-gmcc-green",
    subcategories: [
      { label: "Open Swim", href: "/visit/pool-availability" },
      { label: "Youth Programs", href: "/programs" },
      { label: "Child Watch", href: "/programs" },
      { label: "Camps", href: "/camps" },
    ],
  },
  {
    id: "learn",
    icon: "🎨",
    title: "Learn Something New",
    description: "Take a beginner class, explore the arts, or attend a seminar.",
    color: "bg-gmcc-teal",
    subcategories: [
      { label: "Beginner Sports Classes", href: "/programs" },
      { label: "Art Programs", href: "/programs" },
      { label: "Seminars & Workshops", href: "/programs" },
    ],
  },
  {
    id: "community",
    icon: "🤝",
    title: "Community Building",
    description: "Connect with neighbors, join drop-in activities, find resources.",
    color: "bg-gmcc-green-dark",
    subcategories: [
      { label: "Social Events", href: "/events" },
      { label: "Drop-In Activities", href: "/visit/community-activity-schedules" },
      { label: "Community Resources", href: "/get-involved" },
    ],
  },
  {
    id: "wellness",
    icon: "🧘",
    title: "Wellness & Relaxation",
    description: "Relax, unwind, and take care of your mind andbody.",
    color: "bg-gmcc-teal",
    subcategories: [
      { label: "Yoga", href: "/wellness-relaxation" },
      { label: "Restoring Movement Classes", href: "/programs" },
      { label: "Spa", href: "/pool-schedule" },
      { label: "Trips", href: "/events" },
    ],
  },
];

// ─── Section 2 data ──────────────────────────────────────────────────────────

const TODAY_SCHEDULE: Record<string, { time: string; activity: string }[]> = {
  "Community Center": [
    { time: "6:00 AM-7:00 AM", activity: "Early Bird Aqua Fit" },
    { time: "8:30 AM-9:30 AM", activity: "Zumba" },
    { time: "10:00 AM-4:00 PM", activity: "Open Lap Swim" },
    { time: "12:00 PM-1:00 PM", activity: "Mah Jong" },
    { time: "5:30 PM-6:30 PM", activity: "Yoga" },
    { time: "All Day", activity: "Walking Track\nBilliards\nPuzzles" },

  ],
  "Tennis Center": [
    { time: "10:00 AM-11:00 AM", activity: "Tennis 101" },
    { time: "12:00 PM-1:00 PM", activity: "Sweat It Off" },
    { time: "All Day", activity: "Drop-In Tennis\nDrop-In Pickleball" },
  ],
  "Coleman Family Center": [
    { time: "10:00 AM-11:00 AM", activity: "Mindful Movement" },
    { time: "5:00 PM-6:00 PM", activity: "Cardio Drumming" },
    { time: "5:00 PM-7:00 PM", activity: "Adult Drop-In Basketball" },
    { time: "All Day", activity: "Billiards" },
  ],
  "North Family Center": [
    { time: "7:00 AM-9:00 AM", activity: "Drop-In Pickleball" },
    { time: "11:00 AM-12:00 PM", activity: "Functional Fitness" },
    { time: "2:00 PM-4:00 PM", activity: "Drop-In Pickleball" },
    { time: "All Day", activity: "Billiards" },
  ],
};

const TODAY_EVENTS = [
  {
    title: "Family Fun Night",
    center: "Coleman Family Center",
    time: "6:00 – 8:00 PM",
    description: "Games, activities, and snacks for the whole family. Free with membership or day pass.",
  },
  {
    title: "Dinks and Drinks",
    center: "Tennis Center",
    time: "5:00 – 7:00 PM",
    description: "Meet other tennis players and enjoy an informal round-robin. All skill levels welcome.",
  },
];

// ─── Section 3 data ──────────────────────────────────────────────────────────

const ACCESS_OPTIONS = [
  {
    type: "Day Pass",
    tagline: "One-time visit",
    badge: "badge-blue",
    icon: "🎟️",
    who: "Anyone who wants to try us out without committing.",
    how: "Purchase at the Welcome Desk.",
    price: "Starting at $7",
    includes: ["Full facility access for the day", "Drop-in classes (space permitting)", "Locker room use"],
  },
  {
    type: "Guest Pass",
    tagline: "Visiting with a member",
    badge: "badge-teal",
    icon: "👥",
    who: "Friends or family visiting alongside a current member.",
    how: "Come in with the member and pay the guest fee at the Welcome Desk.",
    price: "Starting at $8",
    includes: ["Same access as a Day Pass", "Must be accompanied by member", "Up to 2 guests per member visit"],
  },
  {
    type: "Free Trial",
    tagline: "Considering membership",
    badge: "badge-green",
    icon: "✨",
    who: "Prospective members who want to experience Greater Midland before joining.",
    how: "Ask at the Welcome Desk — one free trial per household.",
    price: "Free",
    includes: ["Full facility access for one day", "Welcome tour available", "No obligation to join"],
  },
  {
    type: "Membership",
    tagline: "Regular participation",
    badge: "badge-neutral",
    icon: "🏅",
    who: "Anyone planning to visit more than a few times per month.",
    how: "Sign up at the Welcome Desk or online. Flexible plan options available.",
    price: "Starting at $12/month",
    includes: ["Unlimited facility access", "Free or discounted classes", "Varying membership options"],
  },
];

// ─── Section 4 data ──────────────────────────────────────────────────────────

const SAMPLE_DAYS = [
  {
    id: "fitness",
    title: "Fitness Focused",
    tagline: "Max out your workout day",
    accentClass: "bg-gmcc-navy",
    textClass: "text-gmcc-navy",
    borderClass: "border-gmcc-navy",
    bgLight: "bg-gmcc-navy/5",
    stops: [
      { time: "8:30 AM", activity: "Group Fitness Class", center: "Community Center", note: "Zumba, yoga, cycling, and more" },
      { time: "11:00 AM", activity: "Drop-In Tennis", center: "Tennis Center", note: "Courts available, bring a partner" },
      { time: "2:00 PM", activity: "Mindful Movement", center: "Coleman Family Center", note: "Stretching and recovery" },
      { time: "3:00 PM", activity: "Massage Therapy", center: "Coleman Family Center", note: "With our licensed massage therapist" },
    ],
  },
  {
    id: "family",
    title: "Family Fun",
    tagline: "A day the whole family will love",
    accentClass: "bg-gmcc-teal",
    textClass: "text-gmcc-teal-dark",
    borderClass: "border-gmcc-teal",
    bgLight: "bg-gmcc-teal-light/30",
    stops: [
      { time: "10:00 AM", activity: "Drop-In Open Swim", center: "Community Center", note: "Pool open for all ages" },
      { time: "12:30 PM", activity: "The Zone", center: "Community Center", note: "Hit a workout while the kids socialize and play" },
      { time: "6:00 PM", activity: "Family Fun Night", center: "Coleman Family Center", note: "Games, crafts, and snacks" },
    ],
  },
  {
    id: "community",
    title: "Community Connection",
    tagline: "Slow down and connect",
    accentClass: "bg-gmcc-green",
    textClass: "text-gmcc-green-dark",
    borderClass: "border-gmcc-green",
    bgLight: "bg-gmcc-green-lightest/50",
    stops: [
      { time: "9:00 AM", activity: "Walking Track", center: "Community Center", note: "Free with any access; great for a morning stroll" },
      { time: "11:00 AM", activity: "Mah Jong", center: "Community Center", note: "Drop in and join a game" },
      { time: "1:00 PM", activity: "Billiards", center: "Coleman Family Center", note: "Casual, drop-in billiards room" },
      { time: "5:00 PM", activity: "Drinks and Dinks", center: "Tennis Center", note: "Meet people, play tennis, have drinks" },
    ],
  },
];

// ─── Section 5 data ──────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    id: "membership",
    title: "Do I need a membership to visit?",
    content: (
      <div className="space-y-3 body">
        <p>
          No! You can visit any Greater Midland center with a <strong>Day Pass</strong>, a{" "}
          <strong>Guest Pass</strong> (if you&rsquo;re with a member), or a one-time{" "}
          <strong>Free Trial</strong> if you&rsquo;re considering joining.
        </p>
        <p>
          Memberships are the most cost-effective option if you plan to visit regularly — most
          members break even after just 3&ndash;4 visits per month.
        </p>
        <p>
          <Link href="/membership" className="link">
            Explore membership options →
          </Link>
        </p>
      </div>
    ),
  },
  {
    id: "daypass",
    title: "How can I buy a day pass?",
    content: (
      <div className="space-y-3 body">
        <p>
          Day passes are available at the <strong>Welcome Desk</strong> at any Greater Midland
          center — just walk in! You can also purchase one online before your visit.
        </p>
        <p>Prices start at $10 and may vary by center and activity.</p>
        <p>
          <Link href="/contact" className="link">
            Contact us with questions →
          </Link>
        </p>
      </div>
    ),
  },
  {
    id: "which-center",
    title: "Which center should I visit?",
    content: (
      <div className="space-y-3 body">
        <p>It depends on what you&rsquo;re looking for:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>
            <strong>Community Center</strong> — largest facility; pool, fitness center, group fitness, walking track
          </li>
          <li>
            <strong>Tennis Center</strong> — dedicated tennis and pickleball courts; leagues and drop-in play
          </li>
          <li>
            <strong>Coleman Family Center</strong> — family-friendly programming, youth activities, billiards
          </li>
          <li>
            <strong>North Family Center</strong> — fitness classes, open gym, community fitness programs
          </li>
        </ul>
        <p>
          <Link href="/centers" className="link">
            Learn more about each center →
          </Link>
        </p>
      </div>
    ),
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VisitPage() {
  return (
    <main>
      <PhotoWaveHeader
        title="Plan Your Visit"
        waveFillClassName="text-gmcc-navy"
        waveEdgeClassName="bg-gmcc-navy"
        flushBottom={true}
        subheader="Whatever you're looking for — a workout, a swim, a class, or a community — you'll find it at Greater Midland."
        imageUrl="/images/VisitPhoto.png"
        ctas={[
          { label: "Day Pass Options", href: "#access", variant: "primary" } as { label: string; href: string; variant: "primary" | "secondary" },
          { label: "Today's Schedule", href: "#today", variant: "secondary" } as { label: string; href: string; variant: "primary" | "secondary" },
        ].map((c) => ({ label: c.label, url: c.href, variant: c.variant }))}
      />

      {/* ── Section 1: What Are You Looking For? ─────────────────────────── */}
      <section className="mt-0 pt-0" id="categories">
        <div className="bg-gmcc-navy">
        <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-10 text-center">
          <h2 className="h2 text-white">What Are You Looking For?</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <div key={cat.id} className="card flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${cat.color}`}
                >
                  {cat.icon}
                </span>
                <div>
                  <h3 className="h3">{cat.title}</h3>
                  <p className="small mt-0.5">{cat.description}</p>
                </div>
              </div>
              <ul className="flex flex-wrap gap-2">
                {cat.subcategories.map((sub) => (
                  <li key={sub.label}>
                    <Link
                      href={sub.href}
                      className="inline-flex items-center gap-1 rounded-full bg-gmcc-grey-light px-3 py-1 text-sm font-medium text-gmcc-grey-dark transition-colors hover:bg-gmcc-navy hover:text-white"
                    >
                      {sub.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        </div>
        </div>
        <div className="pointer-events-none -mt-px w-full overflow-hidden leading-none">
          <svg
            viewBox="0 0 390 120"
            className="block h-14 w-full text-gmcc-navy md:hidden"
            preserveAspectRatio="none"
          >
            <path
              d="
                M0,98
                C78,62 135,54 195,74
                C255,96 322,88 390,60
                L390,0 L0,0 Z
              "
              fill="currentColor"
            />
          </svg>

          <svg
            viewBox="0 0 1440 120"
            className="hidden h-16 w-full text-gmcc-navy md:block"
            preserveAspectRatio="none"
          >
            <path
              d="
                M0,110
                C300,-50  500,120  800,100
                S1000,0 1440,0
                L1440,0 L0,0 Z
              "
              fill="currentColor"
            />
          </svg>
        </div>
      </section>

      {/* ── Section 2: What's Happening Today? ───────────────────────────── */}
      <section className="pt-16" id="today">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10">
            <h2 className="h2 text-center">What&rsquo;s Happening Today?</h2>
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-gmcc-navy text-white">
                  {Object.keys(TODAY_SCHEDULE).map((center) => (
                    <th
                      key={center}
                      className="px-5 py-4 text-center font-semibold text-sm"
                    >
                      {center}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="align-top">
                  {Object.values(TODAY_SCHEDULE).map((items, ci) => (
                    <td key={ci} className="px-5 py-4 border-r border-neutral-100 last:border-0">
                      <ul className="space-y-3">
                        {items.map((item, ii) => (
                          <li key={ii} className="flex gap-2">
                            <span className="mt-0.5 shrink-0 text-xs font-semibold text-gmcc-teal w-16">
                              {item.time}
                            </span>
                            <span className="text-gmcc-grey-dark whitespace-pre-line">{item.activity}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <div className="grid gap-4 md:hidden">
            {Object.entries(TODAY_SCHEDULE).map(([center, items]) => (
              <div key={center} className="card">
                <h3 className="h3 mb-3 border-b border-neutral-100 pb-2 bg-gmcc-navy text-white text-center">{center}</h3>
                <ul className="space-y-2">
                  {items.map((item, ii) => (
                    <li key={ii} className="flex gap-2 text-sm">
                      <span className="shrink-0 font-semibold text-gmcc-teal w-16">{item.time}</span>
                      <span className="text-gmcc-grey-dark">{item.activity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* "Don't Miss These Events" */}
          {TODAY_EVENTS.length > 0 && (
            <div className="mt-12">
              <h3 className="h3 mb-6">Don&rsquo;t Miss These Fun Events Happening Today!</h3>
              <div className="grid gap-5 sm:grid-cols-2">
                {TODAY_EVENTS.map((event) => (
                  <div key={event.title} className="card card-hover p-0 border-l-4 border-l-gmcc-teal bg-gmcc-blue-light/30">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-1 pl-4 py-4">
                    <div>
                      <p className="eyebrow mb-1">{event.center}</p>
                      <h4 className="h3 mb-1">{event.title}</h4>
                      <p className="small mb-2 font-semibold text-gmcc-teal-dark">{event.time}</p>
                      <p className="body">{event.description}</p>
                    </div>
                    </div>
                    <div className="col-span-1">
                      <img src="/images/VisitPhoto.png" alt={event.title} className="w-full h-full object-cover rounded-r-2xl" />
                    </div>
                  </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Section 3: Visiting For the Day? ─────────────────────────────── */}
      <section className="pt-16" id="access">
        <div className="pointer-events-none w-full overflow-hidden leading-none">
            <svg
              viewBox="0 0 1440 120"
              className="-ml-px block h-10 w-[calc(100%+2px)] text-gmcc-navy md:h-16"
              preserveAspectRatio="none"
            >
              <path
                d="
                  M-20,110
                  C750,-90  800,120  1200,80
                  S1420,0 1460,0
                  L1460,0 L-20,0 Z
                "
                transform="translate(0 120) scale(1 -1)"
                fill="var(--gmcc-navy)"
              />
            </svg>
          </div>

          <div className="bg-gmcc-navy mt-[-2px] pt-0">
          <div className="mx-auto max-w-6xl px-4 pt-12 pb-4">
            <h2 className="h2 text-white">Visiting For the Day?</h2>
            <p className="body mt-2 max-w-2xl text-neutral-200 mb-8">
              Choose the access option that best fits your visit.
            </p>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {ACCESS_OPTIONS.map((opt) => (
            <div key={opt.type} className="card flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <span className="text-3xl">{opt.icon}</span>
                <span className={`badge ${opt.badge}`}>{opt.tagline}</span>
              </div>
              <div>
                <h3 className="h3">{opt.type}</h3>
                <p className="small mt-1 font-semibold text-gmcc-teal-dark">{opt.price}</p>
              </div>
              <p className="body">{opt.who}</p>
              <div>
                <p className="eyebrow mb-1">How to get it</p>
                <p className="small">{opt.how}</p>
              </div>
              <ul className="space-y-1 border-t border-neutral-100 pt-3">
                {opt.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2 small">
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-gmcc-green"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="body mt-12 text-center text-neutral-200">
          Questions about access?{" "}
          <Link href="/contact" className="link text-gmcc-teal">
            Contact us
          </Link>{" "}
          or ask at the Welcome Desk at any center.
        </p>
        </div>
        </div>
        
        <div className="pointer-events-none -mt-px w-full overflow-hidden leading-none">
          <svg
            viewBox="0 0 390 120"
            className="block h-14 w-full text-gmcc-navy md:hidden"
            preserveAspectRatio="none"
          >
            <path
              d="
                M0,98
                C78,62 135,54 195,74
                C255,96 322,88 390,60
                L390,0 L0,0 Z
              "
              fill="currentColor"
            />
          </svg>

          <svg
            viewBox="0 0 1440 120"
            className="hidden h-16 w-full text-gmcc-navy md:block"
            preserveAspectRatio="none"
          >
            <path
              d="
                M0,110
                C300,-50  500,120  800,100
                S1000,0 1440,0
                L1440,0 L0,0 Z
              "
              fill="currentColor"
            />
          </svg>
        </div>
      </section>

      {/* ── Section 4: Build Your Perfect Day ────────────────────────────── */}
      <section className="pt-16" id="perfect-day">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10">
            <h2 className="h2">Build Your Perfect Day</h2>
            <p className="body mt-2">
              Need inspiration? Here are three ways people spend a day at Greater Midland.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {SAMPLE_DAYS.map((day) => (
              <div
                key={day.id}
                className={`rounded-2xl border-2 ${day.borderClass} ${day.bgLight} p-6 flex flex-col gap-5`}
              >
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className={`font-heading font-bold text-xl ${day.textClass}`}>
                      {day.title}
                    </h3>
                    <p className="small">{day.tagline}</p>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-neutral-400" aria-hidden />
                  <ol className="space-y-4">
                    {day.stops.map((stop, idx) => (
                      <li key={idx} className="pl-6 relative">
                        <span
                          className={`absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 border-white ${day.accentClass}`}
                        />
                        <p className={`text-xs font-semibold uppercase tracking-wide ${day.textClass}`}>
                          {stop.time}
                        </p>
                        <p className="text-sm font-semibold text-neutral-700">{stop.activity}</p>
                        <p className="text-xs text-neutral-500">{stop.center}</p>
                        <p className="text-xs text-neutral-500 italic">{stop.note}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>

          <p className="body mt-8 text-center text-neutral-700">
            Mix and match activities across all four centers — your Greater Midland All Access Membership or
            Day Pass covers them all.
          </p>
        </div>
      </section>

      {/* ── Section 5: FAQs ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 pt-16 mt-12" id="faqs">
        <div className="mb-8">
          <h2 className="h2 text-center">FAQs for First-Time Visitors</h2>
        </div>
        <Accordion items={FAQ_ITEMS} allowMultiple />
      </section>

      {/* CONTACT SECTION */}
        <section className="mx-auto pt-16 mt-12 mb-16 max-w-6xl px-6 text-center">
        <h2 className="h2 text-gmcc-navy">Have Questions?</h2>
        <Link href="/contact" className="btn bg-gmcc-navy text-white hover:bg-neutral-100 mt-6 text-base px-8 py-3">
          Contact Us
        </Link>
      </section>
    </main>
  );
}
