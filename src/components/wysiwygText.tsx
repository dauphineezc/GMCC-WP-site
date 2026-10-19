import parse, {
  domToReact,
  Element,
  type DOMNode,
  type HTMLReactParserOptions,
} from "html-react-parser";
import { asWysiwyg, openLinkInNewTab } from "@/lib/acf";

/** Tags marketing may use in limited ACF WYSIWYG fields. */
const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "a",
]);

/** Drop entirely (do not unwrap children — avoids leftover captions/alt text). */
const STRIP_TAGS = new Set([
  "img",
  "picture",
  "source",
  "video",
  "audio",
  "iframe",
  "object",
  "embed",
  "svg",
  "figure",
  "figcaption",
  "script",
  "style",
  "form",
  "input",
  "button",
  "textarea",
  "select",
]);

function looksLikeHtml(s: string): boolean {
  return /<[a-z][\s\S]*>/i.test(s);
}

/** Bullet / dash markers often pasted into Text Area fields before they become WYSIWYG. */
const PLAIN_BULLET_RE = /^[\u2022\u2023\u25E6\u2043\u2219•·‣▪▸►\-\*]\s+/;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Turn plain-text lines that start with bullet characters into a real `<ul>`,
 * so wrapped lines get a hanging indent via list CSS (not flush under the marker).
 */
function plainTextBulletsToHtml(text: string): string | null {
  const lines = text.split(/\r?\n/);
  const items: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (items.length) continue; // ignore blank lines inside a list block
      return null;
    }
    if (!PLAIN_BULLET_RE.test(trimmed)) return null;
    items.push(escapeHtml(trimmed.replace(PLAIN_BULLET_RE, "").trim()));
  }
  if (items.length < 2) return null;
  return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

/** Allow http(s), mailto, tel, hash, and relative paths; reject other schemes. */
function safeHref(raw: string | undefined): string | null {
  if (!raw) return null;
  const href = raw.trim();
  if (!href) return null;
  if (/^(https?:|mailto:|tel:|#|\/|\.\/|\.\.\/)/i.test(href)) return href;
  // Relative path / query with no scheme
  if (!/^[a-z][a-z0-9+.-]*:/i.test(href)) return href;
  return null;
}

function hasUnderlineStyle(style: string | undefined): boolean {
  if (!style) return false;
  return /text-decoration(?:-line)?\s*:\s*[^;]*underline/i.test(style);
}

/**
 * Render an ACF WYSIWYG field with a strict allowlist:
 * bold, italic, underline, bullet/numbered lists, and links.
 * All other markup (alignment, blockquotes, media, headings, etc.) is ignored
 * without throwing — media nodes are removed; other tags are unwrapped to text.
 */
export default function WysiwygText({
  html,
  className = "",
}: {
  html: unknown;
  className?: string;
}) {
  const raw = asWysiwyg(html);
  if (!raw) return null;

  // Text Area leftovers (• / - lines) → real list HTML so hanging indent CSS applies.
  const trimmed =
    !looksLikeHtml(raw) ? plainTextBulletsToHtml(raw) ?? raw : raw;

  if (!looksLikeHtml(trimmed)) {
    return (
      <div className={`wysiwyg whitespace-pre-line ${className}`.trim()}>
        {trimmed}
      </div>
    );
  }

  const options: HTMLReactParserOptions = {
    replace(domNode) {
      if (!(domNode instanceof Element)) return;

      const name = domNode.name.toLowerCase();
      const children = (domNode.children ?? []) as DOMNode[];

      if (STRIP_TAGS.has(name)) return <></>;

      // TinyMCE often underlines via <span style="text-decoration: underline">
      if (name === "span") {
        const kids = domToReact(children, options);
        if (hasUnderlineStyle(domNode.attribs?.style)) {
          return <u>{kids}</u>;
        }
        return <>{kids}</>;
      }

      if (!ALLOWED_TAGS.has(name)) {
        if (!children.length) return <></>;
        return <>{domToReact(children, options)}</>;
      }

      const kids = name === "br" ? null : domToReact(children, options);

      switch (name) {
        case "br":
          return <br />;
        case "p":
          return <p>{kids}</p>;
        case "strong":
        case "b":
          return <strong>{kids}</strong>;
        case "em":
        case "i":
          return <em>{kids}</em>;
        case "u":
          return <u>{kids}</u>;
        case "ul":
          return <ul>{kids}</ul>;
        case "ol":
          return <ol>{kids}</ol>;
        case "li":
          return <li>{kids}</li>;
        case "a": {
          const href = safeHref(domNode.attribs?.href);
          if (!href) return <>{kids}</>;
          const targetAttr = domNode.attribs?.target;
          const newTab = openLinkInNewTab(
            href,
            targetAttr === "_blank" || targetAttr === "_self" ? targetAttr : undefined,
          );
          return (
            <a
              href={href}
              className="font-semibold text-gmcc-teal no-underline hover:text-gmcc-navy hover:no-underline"
              {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {kids}
            </a>
          );
        }
        default:
          return <>{kids}</>;
      }
    },
  };

  return <div className={`wysiwyg ${className}`.trim()}>{parse(trimmed, options)}</div>;
}
