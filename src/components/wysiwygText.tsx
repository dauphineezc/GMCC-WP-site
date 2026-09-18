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
  const trimmed = asWysiwyg(html);
  if (!trimmed) return null;

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
