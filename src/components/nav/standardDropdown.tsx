import { NavItem } from "@/lib/nav/tree";
import { getIconPath } from "@/lib/nav/getIconPath";
import Link from "next/link";
import Image from "next/image";

function StandardDropdown({ item }: { item: NavItem }) {
  return (
    <div className="flex gap-20">
      {item.children.map((child) => (
        <Link
          key={child.id}
          href={child.href}
          className="group flex flex-col items-center text-center min-w-[120px]"
        >
          <div className="w-[72px] h-[72px] flex items-center justify-center">
            <Image
              src={getIconPath(child.label)}
              alt=""
              width={72}
              height={72}
              className="w-[72px] h-[72px] object-contain"
            />
          </div>
          <div className="mt-4 text-[18px] font-bold text-gmcc-navy transition-all duration-200 ease-out group-hover:-translate-y-0.75 group-hover:text-gmcc-teal">
            {child.label}
          </div>
        </Link>
      ))}
    </div>
  );
}

export default StandardDropdown;