export type TranslateLang = "en" | "es";

export const LANG_COOKIE = "gmcc_preferred_lang";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: {
          new (
            options: {
              pageLanguage: string;
              includedLanguages: string;
              autoDisplay: boolean;
            },
            elementId: string
          ): void;
          InlineLayout: { SIMPLE: number };
        };
      };
    };
  }
}

export function isLocalhost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.startsWith("192.168.")
  );
}

/** Legacy redirect flow left users on translate.goog, which breaks on auth-protected sites. */
export function isOnLegacyGoogleTranslateProxy(): boolean {
  return (
    typeof window !== "undefined" &&
    window.location.hostname.includes("translate.goog")
  );
}

/**
 * Decode translate.goog hostnames back to the original host.
 * Google maps dots to hyphens; the registrable domain is the last two hyphen segments.
 */
export function decodeTranslateGoogHostname(hostname: string): string | null {
  const hostPart = hostname.replace(/\.translate\.goog$/i, "");
  const parts = hostPart.split("-").filter(Boolean);
  if (parts.length < 2) return null;

  const tld = parts.pop()!;
  const domainLabel = parts.pop()!;
  const subdomain = parts.length > 0 ? `${parts.join("-")}.` : "";
  return `${subdomain}${domainLabel}.${tld}`;
}

export function escapeLegacyTranslateProxy(): void {
  if (!isOnLegacyGoogleTranslateProxy()) return;

  const url = new URL(window.location.href);
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const decodedHost =
    decodeTranslateGoogHostname(url.hostname) ??
    (configuredOrigin ? new URL(configuredOrigin).hostname : null);

  if (!decodedHost) return;

  const cleanParams = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    if (!key.startsWith("_x_tr_")) cleanParams.set(key, value);
  });
  const query = cleanParams.toString();
  const target = `https://${decodedHost}${url.pathname}${query ? `?${query}` : ""}`;
  window.location.replace(target);
}

export function getGoogleTranslateLang(): TranslateLang {
  if (typeof document === "undefined") return "en";

  const cookies = document.cookie.split(";");
  for (const entry of cookies) {
    const [name, value] = entry.trim().split("=");
    if (name === "googtrans" && value?.includes("/es")) return "es";
  }
  return "en";
}

/**
 * Set a cookie. "googtrans" must NOT carry SameSite=Lax because GT's widget
 * script (loaded from translate.google.com) reads it as a first-party cookie
 * on this origin, but some browsers treat the lack of SameSite as Lax by
 * default and block it in cross-origin sub-frames GT uses internally. Omitting
 * SameSite entirely lets the browser apply its default (Lax for most), which
 * works correctly for GT. Our own preference cookie still uses Lax explicitly.
 */
function setCookie(
  name: string,
  value: string,
  hostname: string,
  sameSite?: "Lax" | "None"
) {
  const expires = new Date(Date.now() + 365 * 864e5).toUTCString();
  const sameAttr = sameSite ? `;SameSite=${sameSite}${sameSite === "None" ? ";Secure" : ""}` : "";
  const base = `${name}=${value};expires=${expires};path=/${sameAttr}`;
  document.cookie = base;
  if (!isLocalhost()) {
    document.cookie = `${base};domain=${hostname}`;
    document.cookie = `${base};domain=.${hostname}`;
  }
}

function clearCookie(name: string, hostname: string) {
  const expired = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
  const variants = [`${name}=;path=/;${expired}`];
  if (!isLocalhost()) {
    variants.push(`${name}=;path=/;domain=${hostname};${expired}`);
    variants.push(`${name}=;path=/;domain=.${hostname};${expired}`);
  }
  for (const cookie of variants) {
    document.cookie = cookie;
  }
}

export function setPreferredLangCookie(lang: TranslateLang) {
  setCookie(LANG_COOKIE, lang, window.location.hostname, "Lax");
}

/** Apply in-browser translation (works behind login; no translate.goog redirect). */
export function applyGoogleTranslate(lang: TranslateLang): void {
  if (typeof window === "undefined") return;

  setPreferredLangCookie(lang);
  const hostname = window.location.hostname;

  if (lang === "es") {
    // googtrans cookie: no SameSite so GT's widget can reliably read it.
    setCookie("googtrans", "/en/es", hostname);
  } else {
    clearCookie("googtrans", hostname);
  }

  window.location.reload();
}

let scriptPromise: Promise<void> | null = null;

export function loadGoogleTranslateScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.translate?.TranslateElement) return Promise.resolve();

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      window.googleTranslateElementInit = () => resolve();
      const script = document.createElement("script");
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      script.onerror = () => reject(new Error("Google Translate failed to load"));
      document.body.appendChild(script);
    });
  }

  return scriptPromise;
}

export function initGoogleTranslateOnPage(): void {
  if (getGoogleTranslateLang() !== "es") return;

  void loadGoogleTranslateScript().then(() => {
    if (!document.getElementById("google_translate_element")) return;
    if (!window.google?.translate?.TranslateElement) return;

    new window.google.translate.TranslateElement(
      {
        pageLanguage: "en",
        includedLanguages: "en,es",
        autoDisplay: false,
      },
      "google_translate_element"
    );
  });
}
