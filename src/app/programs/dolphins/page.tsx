import HeaderImage from "@/components/headerImage";

export default async function DolphinsPage() {
  return (
    <main>
      {/* HEADER IMAGE - Full Width */}
      <div className="w-full">
        <HeaderImage src="/images/DolphinsHeaderImage.png" alt="Dolphins Swim Team" />
      </div>

      <div className="mx-auto max-w-6xl px-4 section-y stack-8">
        <div>
          <h1 className="h1 text-gmcc-navy">Dolphins Swim Team</h1>
        </div>

        <h3 className="h3">The Midland Dolphins Swim Team is a year-round competitive swim team in Midland, Michigan, dedicated to 
            providing high-quality coaching and opportunities for swimmers of all ages and abilities.</h3>

          <div>
            <h3 className="eyebrow mb-2">Overview</h3>
            <p className="body">The Midland Dolphins Swim Team focuses on improving 
                swimming skills and achieving success at various levels, from novice swimmers to international competitors. 
                The team operates as a non-profit organization, managed by an elected Board of Directors, and encourages 
                member involvement in team activities and fundraising efforts.</p>
          </div>

          <div>
            <h3 className="eyebrow mb-2">Coaching and Training</h3>
            <p className="body">The team is led by experienced coaches who are 
                dedicated to developing swimmers' techniques and competitive skills. The coaching staff includes individuals 
                with extensive backgrounds in swimming and coaching, ensuring that athletes receive quality instruction.</p>
          </div>

          <div>
            <h3 className="eyebrow mb-2">Upcoming Events</h3>
            <p className="body">The Midland Dolphins host various swim meets throughout 
                the year, including the annual Midland Dolphin Invitational. The next meet is scheduled for December 14, 2024, 
                at HH Dow High School, where swimmers will compete in various events.</p>
          </div>

          <div>
            <h3 className="eyebrow mb-2">Contact Information</h3>
            <p className="body">For more information about the Midland Dolphins Swim Team,
                 including registration details and practice schedules, you can contact them at midlanddolphins@greatermidland.org.
                  This team provides a supportive environment for swimmers to grow and excel in the sport, making it a great 
                  choice for anyone interested in competitive swimming in the Midland area.</p>
          </div>
        </div>
    </main>
  );
}