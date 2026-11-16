import { Reveal } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <header id="top" className="relative overflow-hidden bg-ink text-white">
      <div
        aria-hidden="true"
        className="hero-glow pointer-events-none absolute -top-40 -right-28 size-[520px] rounded-full"
      />

      <div className="wrap relative grid gap-12 py-[clamp(48px,7vw,96px)] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:gap-[clamp(32px,5vw,72px)]">
        <div>
          <Reveal>
            <span className="eyebrow text-primary">Learn. Launch. Sell. Grow.</span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="text-h1 mt-1">
              Turn your skills into an online&nbsp;business.
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-6 max-w-[56ch] text-[clamp(16px,1.6vw,19px)] leading-relaxed text-white/70">
              Practical e-commerce training for Etsy, Amazon and Flipkart, taught by a seller who
              runs real stores. Small batches, live sessions, online or in Roorkee.
            </p>
          </Reveal>

          <Reveal delay={220}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href="#enquire">Enquire now</a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/35 text-white hover:bg-white/10"
              >
                <a href="#courses">See courses</a>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={280}>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2.5 text-sm text-white/75">
              {["Online + offline classes", "Small batches", "Doubt support after class"].map(
                (item) => (
                  <span key={item} className="inline-flex items-center gap-2.5">
                    <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
                    {item}
                  </span>
                ),
              )}
            </div>
          </Reveal>
        </div>

        <Reveal delay={120} className="justify-self-center lg:justify-self-end">
          <figure className="group relative m-0 aspect-4/5 w-full max-w-[420px] overflow-hidden rounded-[22px] bg-neutral-800 shadow-[0_30px_60px_rgba(0,0,0,0.5)] transition-transform duration-700 ease-out lg:rotate-[1.5deg] lg:hover:rotate-0">
            <img
              src="/media/workshop.jpg"
              alt="NEZX founder inspecting a brass bowl with a craftsman in a workshop"
              width={900}
              height={1200}
              fetchPriority="high"
              className="h-full w-full object-cover object-[60%_40%]"
            />
            <figcaption className="absolute inset-x-3.5 bottom-3.5 rounded-xl bg-black/70 px-3.5 py-2.5 text-[13px] leading-snug text-white/90 backdrop-blur-md">
              Learning from real products and real makers, not slides.
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </header>
  );
}
