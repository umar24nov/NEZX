import { useState } from "react";
import { X } from "lucide-react";

import type { MediaDto } from "@nezx/shared";

import { SectionHeading } from "@/components/site/section-heading";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ResultsProps {
  results: MediaDto[];
  note: string;
}

export function Results({ results, note }: ResultsProps) {
  const [active, setActive] = useState<MediaDto | null>(null);

  return (
    <section id="results" className="scroll-mt-20 bg-ink py-[clamp(64px,8vw,112px)] text-white">
      <div className="wrap">
        <SectionHeading
          eyebrow="Real dashboards"
          tone="dark"
          title="Taught by someone who sells."
          lead="Screenshots from the founder's own Etsy and Amazon seller accounts. Tap an image to enlarge it."
        />

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-[0.8fr_0.8fr_1.5fr] xl:items-start">
          {results.map((asset, index) => (
            <figure
              key={asset.id}
              className={cn(
                "m-0 rounded-2xl border border-white/10 bg-white/[0.045] p-3",
                index === results.length - 1 && "md:col-span-2 xl:col-span-1",
              )}
            >
              <button
                type="button"
                onClick={() => setActive(asset)}
                className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl focus-visible:ring-4 focus-visible:ring-primary/40"
                aria-label={`Enlarge: ${asset.caption ?? asset.alt}`}
              >
                <img
                  src={asset.url}
                  alt={asset.alt}
                  loading="lazy"
                  className="w-full rounded-xl bg-white/5 transition-transform duration-500 group-hover:scale-[1.015]"
                />
              </button>
              <figcaption className="px-1.5 pt-3 pb-1 text-sm text-white/65">
                {asset.stat ? (
                  <b className="block font-display text-[22px] leading-tight font-extrabold text-primary tabular-nums">
                    {asset.stat}
                  </b>
                ) : null}
                {asset.caption}
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="mt-7 max-w-[70ch] text-[13px] leading-relaxed text-white/45">{note}</p>
      </div>

      <Dialog open={active !== null} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[92vh] w-[min(92vw,1100px)] max-w-none border-0 bg-transparent p-0 shadow-none"
        >
          <DialogTitle className="sr-only">{active?.caption ?? "Dashboard screenshot"}</DialogTitle>
          <DialogDescription className="sr-only">{active?.alt ?? ""}</DialogDescription>

          {active ? (
            <img
              src={active.url}
              alt={active.alt}
              className="mx-auto max-h-[86vh] w-auto rounded-xl object-contain shadow-2xl"
            />
          ) : null}

          <DialogClose
            className="absolute top-3 right-3 inline-flex size-10 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur transition-colors hover:bg-black"
            aria-label="Close enlarged image"
          >
            <X className="size-5" />
          </DialogClose>
        </DialogContent>
      </Dialog>
    </section>
  );
}
