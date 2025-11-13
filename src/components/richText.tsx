"use client";

import parse, { Element, domToReact } from "html-react-parser";

function PdfEmbed({ href }: { href: string }) {
  return (
    <div className="my-6">
      <div className="border rounded overflow-hidden">
        <iframe
          src={`${href}#toolbar=1&navpanes=0`}
          title="PDF preview"
          className="w-full"
          style={{ height: "80vh", width: "80%", alignItems: "center" }}
          loading="lazy"
        />
      </div>
      <p className="mt-2">
        <a href={href} target="_blank" rel="noopener noreferrer" className="underline">
          Download PDF
        </a>
      </p>
    </div>
  );
}

export default function RichText({ html }: { html: string }) {
  return (
    <div className="prose max-w-none">
      {parse(html, {
        replace: (node) => {
          if (!(node as any).name) return;

          const el = node as Element;

          // Pattern 1: Gutenberg File block wrapper <figure class="wp-block-file"> … <a href="...pdf"> …</a>
          if (el.name === "figure" && (el.attribs?.class || "").includes("wp-block-file")) {
            const link = (el.children || []).find((c: any) => c.name === "a") as Element | undefined;
            const href = link?.attribs?.href || "";
            if (/\.pdf($|\?)/i.test(href)) {
              return <PdfEmbed href={href} />;
            }
          }

          // Pattern 2: Plain anchor to a PDF
          else if (el.name === "a") {
            const href = el.attribs?.href || "";
            if (/\.pdf($|\?)/i.test(href)) {
              return <PdfEmbed href={href} />;
            }
          }

          else { return undefined; } // default render }
        },
      })}
    </div>
  );
}