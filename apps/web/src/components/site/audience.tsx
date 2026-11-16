import type { AudienceDto, SiteConfigDto } from "@nezx/shared";

import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";

interface AudienceProps {
  audience: AudienceDto[];
  config: SiteConfigDto;
}

export function Audience({ audience, config }: AudienceProps) {
  return (
    <section id="who" className="scroll-mt-20 py-[clamp(64px,8vw,112px)]">
      <div className="wrap">
        <SectionHeading eyebrow="Who can join" title="No experience needed." />

        <div className="mt-12 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          {audience.map((group, index) => (
            <Reveal key={group.slug} delay={(index % 4) * 70}>
              <div className="h-full rounded-2xl border border-border bg-card p-6">
                <h3 className="text-base">{group.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {group.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2.5">
          {config.formatChips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
