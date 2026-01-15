import Accordion from "@/components/accordion";
import HeaderImage from "@/components/headerImage";

export default function SessionCalendarPage() {
  
  
  return (
    <main>
        <HeaderImage src="/images/SessionCalendarPhoto.png" alt="Session Calendar" />
        <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
          <h1 className="text-3xl font-bold text-gmcc-navy tracking-tight sm:text-4xl mb-4">Session Calendar</h1>
          <h3 className="text-xl text-neutral-700 mt-0 mb-4">View the session calendar to see what programs are available and what fits your schedule.</h3>
        
          <div className="gmcc-schedule-embed mt-4">
            <iframe
            src="https://gmcc-drop-in-schedule.vercel.app/?type=dropin&sub=aquatics"
            style={{ width: "100%", height: "1000px", border: "0", overflow: "visible" }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
    </main>
  );
}