const WORDS = ["Learn", "Research", "Build", "List", "Sell", "Grow"];

function MarqueeRow() {
  return (
    <span className="flex shrink-0 items-center gap-6 pr-6">
      {Array.from({ length: 4 }).flatMap((_, group) =>
        WORDS.map((word) => (
          <span key={`${group}-${word}`} className="flex items-center gap-6">
            <span>{word}</span>
            <span aria-hidden="true" className="text-[10px] opacity-70">
              ✦
            </span>
          </span>
        )),
      )}
    </span>
  );
}

export function Marquee() {
  return (
    <div aria-hidden="true" className="overflow-hidden bg-primary py-2.5 text-primary-foreground">
      <div className="flex w-max animate-marquee items-center font-display text-[13px] font-extrabold tracking-[0.06em] uppercase">
        <MarqueeRow />
        <MarqueeRow />
      </div>
    </div>
  );
}
