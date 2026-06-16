import Accordion from "@/components/accordion";
import HeaderImage from "@/components/headerImage";
import { scheduleEmbedUrl } from "@/lib/constants";

export default function CommunityActivitySchedulesPage() {
  const faqItems = [
    {
      id: "1",
      title: "Community Center",
      content: (
        <div className="gmcc-schedule-embed mt-4">
            <iframe
            src={scheduleEmbedUrl({ type: "dropin", sub: "community" })}
            style={{ width: "100%", height: "1000px", border: "0", overflow: "visible" }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
        </div>
      )
    },
  ];

  return (
    <main>
        <HeaderImage src="/images/CommunityActivityPhoto.png" alt="Community Activity Schedules" />
        <div className="page-section stack-8">
          <h1 className="text-3xl font-bold text-gmcc-navy tracking-tight sm:text-4xl mb-4">Community Activity Schedules</h1>
          <h3 className="text-xl text-neutral-700 mt-0 mb-4">Make new friends and learn new skills by participating in a community activity.
             Free for members; $7 per non-member participant. View the schedules for all community activities at the Community Center below.</h3>
          <p className="text-neutral-700 text-xl mt-0 mb-8">Click on an activity for more information.</p>

          <Accordion 
            items={faqItems}
            allowMultiple={false}        // Only one item open at a time (default)
            defaultOpenIds={["1"]}       // Optionally start with item(s) open
            />
        </div>
    </main>
  );
}