import { useEffect, useRef } from "react";

import type { MediaDto } from "@nezx/shared";

import { SectionHeading } from "@/components/site/section-heading";

function VideoClip({ asset }: { asset: MediaDto }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!("IntersectionObserver" in window) || reduceMotion) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            video.pause();
            continue;
          }
          void video.play().catch(() => undefined);
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <figure className="relative aspect-[9/16] snap-start overflow-hidden rounded-2xl bg-neutral-900">
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="none"
        poster={asset.posterUrl ?? undefined}
        aria-label={asset.alt}
        className="h-full w-full object-cover"
      >
        <source src={asset.url} type="video/mp4" />
      </video>
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-3 pt-10 pb-3 text-[13px] leading-snug font-medium text-white">
        {asset.caption ?? asset.alt}
      </figcaption>
    </figure>
  );
}

interface WorkProps {
  work: MediaDto[];
}

export function Work({ work }: WorkProps) {
  return (
    <section id="work" className="scroll-mt-20 py-[clamp(64px,8vw,112px)]">
      <div className="wrap">
        <SectionHeading
          eyebrow="Our work"
          title="Built around practice, not theory."
          lead="Unpacking stock, listing products, packing orders. This is what a working day looks like, and what you practise in class."
        />

        <div className="no-scrollbar -mx-4 mt-12 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-5 lg:overflow-visible">
          {work.map((asset) => (
            <div key={asset.id} className="w-[70vw] shrink-0 sm:w-[46vw] md:w-[30vw] lg:w-auto lg:shrink">
              <VideoClip asset={asset} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
