import Accordion from "@/components/accordion";
import HeaderImage from "@/components/headerImage";

export default async function GetInvolvedPage() {

  const donationForm = [
    {
      id: "1",
      title: "Donation Form",
      content:       
      <div className="relative overflow-hidden h-[450px] w-full">
        <iframe
          title="Donation form powered by Zeffy"
          src="https://www.zeffy.com/embed/donation-form/give-greater"
          allow="payment"
          className="absolute inset-0 w-full h-full border-0"
        />
    </div>,
    },
  ];


  return (
    <main>
      {/* HEADER IMAGE - Full Width */}
      <div className="w-full">
        <HeaderImage src="/images/GetInvolvedHeaderImage.png" alt="Get Involved" />
      </div>

      <div className="mx-auto max-w-6xl px-4 section-y stack-8">
        <div>
          <h1 className="h1 text-gmcc-navy">Get Involved</h1>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 items-start">
          <div className="card bg-gmcc-blue-light/30 stack-4 flex flex-col">
            <h3 className="h2 text-center mb-2">Volunteer</h3>
            <p className="body text-center flex-grow">
              Help the community by donating your time. Volunteer at an event, race, or another program that interests you.
            </p>
            <a href="/volunteer" className="btn btn-primary mx-auto">
              Volunteer
            </a>
          </div>

          <div className="card bg-gmcc-blue-light/30 stack-4 flex flex-col">
            <h3 className="h2 text-center mb-2">Donate</h3>
            <p className="body text-center flex-grow">
              Whether it’s money or physical items like food or clothes, 100% of your donation goes to helping those in the community.
            </p>
            <a href="/donate" className="btn btn-primary mx-auto">
              Donate
            </a>
          </div>

          <div className="card bg-gmcc-blue-light/30 stack-4 flex flex-col">
            <h3 className="h2 text-center mb-2">Sponsor</h3>
            <p className="body text-center flex-grow">
              Sponsor a race, sports league, or event, and become an advertising partner. Gain exposure while supporting the community.
            </p>
            <a href="/sponsor" className="btn btn-primary mx-auto">
              Sponsor
            </a>
          </div>
        </div>

        <p className="body text-center">With over 3,000 families fed through our food banks, over 16,000 adults improving their health 
          with our fitness programs, and over 300 children enrolled in our education program, Greater Midland has been hard at work helping 
          those in our community for over a century.</p>
          <div className="flex justify-center mt-6">
            <a href="/our-purpose" className="btn btn-secondary">
              See more of our impact
            </a>
          </div>

        {/* Donate */}
        <div className="stack-4">
          <h2 className="h2">Donate</h2>
          <div className="grid gap-16 md:grid-cols-2">
          <div className="stack-2">
            <p className="body">
              Your donation is a life-changing gift for children in our community, providing them with developmental 
              assets and opportunities that will shape their future. When you make a tax-deductible donation to Greater Midland, 
              you are helping us ensure that across all nine of our sites:
            </p>

            <ul className="body list-disc list-inside ml-5">
              <li>Our youngest learners are ready for school</li>
              <li>All kids are connected to a caring adult</li>
              <li>Our kids and adults are moving every day</li>
              <li>Our seniors are connected to the community</li>
            </ul>
          </div>
            <div className="stack-2">
              <img src="/images/DonationPhoto.png" alt="Donate" className="w-full h-full object-cover rounded-md" />
            </div>
          </div>

          <Accordion items={donationForm} />
        </div>








        {/* form - modal popup
        <div className="flex justify-center">
          <a zeffy-form-link="https://www.zeffy.com/embed/donation-form/give-greater?modal=true"></a>
          <script src="https://zeffy-scripts.s3.ca-central-1.amazonaws.com/embed-form-script.min.js"></script>
        </div>
         */}
        {/* form - embedded iframe
        <div className="relative overflow-hidden h-[450px] w-full">
          <iframe
            title="Donation form powered by Zeffy"
            src="https://www.zeffy.com/embed/donation-form/give-greater"
            allow="payment"
            className="absolute inset-0 w-full h-full border-0"
          />
        </div> */}

        {/* thermometer donation tracker
        <div className="relative overflow-hidden w-full h-[120px]">
          <iframe
            title="Donation thermometer powered by Zeffy"
            src="https://www.zeffy.com/embed/thermometer/give-greater"
            className="absolute inset-0 w-full h-full border-0"
          />
        </div> */}

      </div>
    </main>
  );
}