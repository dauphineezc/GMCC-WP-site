import Link from "next/link";
import Image from "next/image";
import { NavItem } from "@/lib/nav/tree";
import { getIconPath } from "@/lib/nav/getIconPath";

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

type ProgramsMegaMenuProps = {
  item: NavItem;
  onClose?: () => void;
};

function ProgramsMegaMenu({ item, onClose }: ProgramsMegaMenuProps) {
  return (
    <div className="flex gap-12">
      {item.children.map((category) => (
        <div key={category.id} className="min-w-[150px]">
          {/* Category header (icon + title) */}
          <Link 
            href={resolveTranslatedHref(category.href)}
            onClick={onClose}
            className="group flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 flex items-center justify-center mb-3">
              <Image
                src={getIconPath(category.label)}
                alt=""
                width={64}
                height={64}
                className="w-16 h-16 object-contain"
              />
            </div>
            <div className="text-[18px] font-bold text-gmcc-navy transition-all duration-200 ease-out group-hover:-translate-y-0.75 group-hover:text-gmcc-teal">
              {category.label}
            </div>
          </Link>

          {/* Third-level links */}
          {category.children.length > 0 && (
            <ul className="mt-4 space-y-2 text-center">
              {category.children.map((leaf) => (
                <li key={leaf.id}>
                  <Link
                    href={resolveTranslatedHref(leaf.href)}
                    onClick={onClose}
                    className="inline-block text-sm text-gray-600 transition-all duration-200 ease-out hover:text-gmcc-teal hover:-translate-y-0.5"
                  >
                    {leaf.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

export default ProgramsMegaMenu;