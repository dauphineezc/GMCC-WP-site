import Accordion from "@/components/accordion";
import HeaderImage from "@/components/headerImage";

export default function GroupFitnessSchedulesPage() {
  const faqItems = [
    {
      id: "1",
      title: "Community Center",
      content: (
        <div className="gmcc-schedule-embed mt-4">
            <iframe
            src="https://gmcc-drop-in-schedule.vercel.app/?type=fitness&sub=aquatics"
            style={{ width: "100%", height: "1000px", border: "0", overflow: "visible" }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
        </div>
      )
    },
    {
      id: "2", 
      title: "Coleman Family Center",
      content: (
        <div className="gmcc-schedule-embed mt-4">
            <iframe
            src="https://gmcc-drop-in-schedule.vercel.app/?type=fitness&sub=aquatics"
            style={{ width: "100%", height: "1000px", border: "0", overflow: "visible" }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
        </div>
      ),
    },
    {
      id: "3",
      title: "North Family Center",
      content: (
        <div className="gmcc-schedule-embed mt-4">
            <iframe
            src="https://gmcc-drop-in-schedule.vercel.app/?type=fitness&sub=aquatics"
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
        <HeaderImage src="/images/GroupFitnessPhoto.png" alt="Group Fitness Schedules" />
        <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
          <h1 className="h1">Group Fitness Schedules</h1>
          <h3 className="text-xl text-neutral-700 mt-0 mb-4">Choose from a variety of group fitness classes to fit your schedule, goals, and 
            interests. View the schedules for all group fitness classes below.</h3>
          <p className="body">Click on a class for more information and to register.</p>

          <Accordion 
            items={faqItems}
            allowMultiple={false}        // Only one item open at a time (default)
            defaultOpenIds={[]}       // Optionally start with item(s) open
            />
        </div>
    </main>
  );
}