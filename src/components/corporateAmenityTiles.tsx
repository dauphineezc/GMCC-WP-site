/** Horizontal hex ends — matches marketing “elongated hex” tiles. */
const HEX_CLIP =
  "[clip-path:polygon(0.5rem_0%,calc(100%-0.5rem)_0%,100%_50%,calc(100%-0.5rem)_100%,0.5rem_100%,0%_50%)]";

function splitIntoRows(items: string[]): string[][] {
  const n = items.length;
  if (n === 0) return [];
  if (n <= 3) return [items];
  if (n === 4) return [items.slice(0, 2), items.slice(2)];
  if (n === 5) return [items.slice(0, 3), items.slice(3)];
  return [items.slice(0, 3), items.slice(3)];
}

export default function CorporateAmenityTiles({ items }: { items: string[] }) {
  const rows = splitIntoRows(items);
  if (rows.length === 0) return null;

  return (
    <div
      className="mx-auto mt-8 flex max-w-5xl flex-col items-center gap-4 md:mt-10"
      role="list"
      aria-label="Included amenities"
    >
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="flex w-full flex-wrap justify-center gap-4"
          role="presentation"
        >
          {row.map((title, i) => (
            <div
              key={`${rowIndex}-${i}-${title}`}
              role="listitem"
              className={`flex min-h-[3.5rem] w-full items-center justify-center bg-gmcc-teal px-6 py-3 text-center font-heading text-[0.7rem] font-bold uppercase leading-snug tracking-wide text-white sm:w-[calc((100%-2rem)/3)] sm:min-w-0 sm:text-xs md:min-h-[4rem] md:px-8 md:py-4 md:text-sm ${HEX_CLIP}`}
            >
              <span className="max-w-[32ch]">{title}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
