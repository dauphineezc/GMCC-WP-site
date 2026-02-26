// src/components/PhoneLink.tsx

import React from "react";

type PhoneLinkProps = {
  phone?: string | null;
  className?: string;
  children?: React.ReactNode;
};

function normalize(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

function formatDisplay(phone: string) {
  const digits = normalize(phone);

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return phone; // fallback
}

export default function PhoneLink({
  phone,
  className,
  children,
}: PhoneLinkProps) {
  if (!phone) return null;

  const digits = normalize(phone);
  if (!digits) return null;

  return (
    <a href={`tel:${digits}`} className={className}>
      {children ?? formatDisplay(phone)}
    </a>
  );
}



/*

example usage:

<PhoneLink phone={centerPhone} className="text-gmcc-teal font-medium">
  📞 Call Now
</PhoneLink>

*/