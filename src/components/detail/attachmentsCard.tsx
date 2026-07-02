import type { AttachmentItem } from "@/lib/wp";

/**
 * "Relevant documents" download list shared by the program and event detail
 * pages. Renders nothing when there are no attachments.
 */
export default function AttachmentsCard({ header = "Relevant documents", attachments }: { header?: string; attachments: AttachmentItem[] }) {
  if (!attachments.length) return null;

  return (
    <div>
      <h3 className="eyebrow mb-3">{header}</h3>
      <div className="flex flex-wrap gap-3">
        {attachments.map((att, i) => (
          <a
            key={i}
            href={att.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 transition-all hover:border-gmcc-teal hover:bg-white hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gmcc-teal/10 text-gmcc-teal">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 3v6h6" />
              </svg>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-neutral-800 group-hover:text-gmcc-navy truncate">
                {att.label}
              </span>
              <span className="text-xs text-neutral-500">PDF • Click to open in a new tab</span>
            </div>
            <svg className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-y-0.5 group-hover:text-gmcc-teal ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}
