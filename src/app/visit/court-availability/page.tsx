import Accordion from "@/components/accordion";
import HeaderImage from "@/components/headerImage";

export default function CourtAvailabilityPage() {
  const faqItems = [
    {
      id: "1",
      title: "Community Center",
      content: (
        <div className="gmcc-schedule-embed mt-4">
            <iframe
            src="https://gmcc-drop-in-schedule.vercel.app/?type=dropin&sub=courtSports"
            style={{ width: "100%", height: "1000px", border: "0", overflow: "visible" }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
        </div>
      )
    },
    {
      id: "2", 
      title: "Tennis Center",
      content: (
        <div className="gmcc-schedule-embed mt-4">
            <iframe
            src="https://gmcc-drop-in-schedule.vercel.app/?type=dropin&sub=courtSports"
            style={{ width: "100%", height: "1000px", border: "0", overflow: "visible" }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
        </div>
      ),
    },
  ];

  return (
    <main>
        <HeaderImage src="/images/CourtsPhoto.png" alt="Court Availability" />
        <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
          <h1 className="text-3xl font-bold text-gmcc-navy tracking-tight sm:text-4xl mb-4">Court Availability</h1>
          <h3 className="text-xl text-neutral-700 mt-0 mb-4">Interested in playing a game of tennis, pickleball, basketball, or volleyball? 
            View the availability of all courts at your preferred center below.</h3>
          <p className="text-neutral-700 text-xl mt-0 mb-8">Click on a court for more information.</p>

          <Accordion 
            items={faqItems}
            allowMultiple={false}        // Only one item open at a time (default)
            defaultOpenIds={[]}       // Optionally start with item(s) open
            />
        </div>
    </main>
  );
}