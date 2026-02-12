import { NavItem } from "@/lib/nav/tree";
import { getIconPath } from "@/lib/nav/getIconPath";
import Link from "next/link";
import Image from "next/image";

function resolveTranslatedHref(href: string): string {
  if (typeof window === "undefined") return href;
  if (!window.location.hostname.includes("translate.goog")) return href;
  if (!href || href.startsWith("#")) return href;

  const currentUrl = new URL(window.location.href);
  const targetLang = currentUrl.searchParams.get("_x_tr_tl") || "es";

  let absoluteTarget = href;
  if (!/^https?:\/\//i.test(href)) {
    const originalHost = window.location.hostname
      .replace(".translate.goog", "")
      .replace(/-/g, ".");
    absoluteTarget = `https://${originalHost}${href.startsWith("/") ? href : `/${href}`}`;
  }

  return `https://translate.google.com/translate?sl=en&tl=${targetLang}&u=${encodeURIComponent(
    absoluteTarget
  )}`;
}

type StandardDropdownProps = {
  item: NavItem;
  onClose?: () => void;
};

function StandardDropdown({ item, onClose }: StandardDropdownProps) {
  return (
    <div className="flex gap-20">
      {item.children.map((child) => (
        <Link
          key={child.id}
          href={resolveTranslatedHref(child.href)}
          onClick={onClose}
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