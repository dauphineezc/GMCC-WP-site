import HeaderImage from "@/components/headerImage";

export default function CorporatePage() {
  
  return (
    <main>
        <HeaderImage src="/images/CorporatePhoto.png" alt="Corporate" />
        <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
          <h1 className="text-3xl font-bold text-gmcc-navy tracking-tight sm:text-4xl mb-4">Corporate</h1>
          <h3 className="text-xl text-neutral-700 mt-0 mb-4">Greater Midland offers a variety of corporate services to our members. View the corporate services available below.</h3>
          <p className="text-neutral-700 text-xl mt-0 mb-8">Click on a corporate service for more information.</p>
        </div>
    </main>
  );
}