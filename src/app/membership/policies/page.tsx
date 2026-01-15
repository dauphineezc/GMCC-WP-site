import HeaderImage from "@/components/headerImage";

export default function PoliciesPage() {
  
  return (
    <main>
        <HeaderImage src="/images/PoliciesPhoto.png" alt="Policies" />
        <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
          <h1 className="text-3xl font-bold text-gmcc-navy tracking-tight sm:text-4xl mb-4">Policies</h1>
          <h3 className="text-xl text-neutral-700 mt-0 mb-4">Greater Midland has a variety of policies in place to ensure the safety and well-being of our members. View the policies available below.</h3>
          <p className="text-neutral-700 text-xl mt-0 mb-8">Click on a policy for more information.</p>
        </div>
    </main>
  );
}