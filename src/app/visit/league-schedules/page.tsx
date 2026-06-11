import Accordion from "@/components/accordion";
import HeaderImage from "@/components/headerImage";

export default function LeagueSchedulesPage() {


  return (
    <main>
        <HeaderImage src="/images/LeaguePhoto.png" alt="League Schedules" />
        <div className="page-section stack-8">
          <h1 className="text-3xl font-bold text-gmcc-navy tracking-tight sm:text-4xl mb-4">League Schedules</h1>
          <h3 className="text-xl text-neutral-700 mt-0 mb-4">Need to check the schedule for a league you're playing in, or want to watch a thrilling 
            game? View the schedules for all in-house leagues (including basketball, volleyball, and more) below.</h3>
          <p className="text-neutral-700 text-xl mt-0 mb-8">Select the league you're interested in to view the schedule.</p>

          <div className="gmcc-schedule-embed mt-4">
            <iframe
            src="https://gmcc-league-management-system.vercel.app"
            style={{ width: "100%", height: "1000px", border: "0", overflow: "visible" }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
        </div>

      </div>
    </main>
  );
}