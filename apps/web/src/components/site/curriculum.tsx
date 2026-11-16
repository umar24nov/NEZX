import type { JourneyStepDto, ModuleDto } from "@nezx/shared";

import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";

interface CurriculumProps {
  modules: ModuleDto[];
  steps: JourneyStepDto[];
}

export function Curriculum({ modules, steps }: CurriculumProps) {
  return (
    <section id="learn" className="scroll-mt-20 bg-muted py-[clamp(64px,8vw,112px)]">
      <div className="wrap">
        <SectionHeading
          eyebrow="What you learn"
          title={`${modules.length} modules, zero to hero.`}
          lead="Step by step, practical and result oriented. Every module ends with work you do on a real marketplace."
        />

        <div className="mt-12 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          {modules.map((module, index) => (
            <Reveal key={module.slug} delay={(index % 4) * 70}>
              <div className="h-full rounded-2xl border border-border bg-card p-5">
                <h3 className="text-base leading-snug">{module.title}</h3>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground marker:text-primary">
                  {module.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <ol className="mt-14 grid gap-6 sm:grid-cols-3 xl:grid-cols-6 xl:gap-3.5">
          {steps.map((step, index) => (
            <li
              key={step.slug}
              className="border-l-[3px] border-primary pl-5 sm:border-t-[3px] sm:border-l-0 sm:pt-3.5 sm:pl-0"
            >
              <span className="block font-display text-[26px] leading-none font-extrabold text-primary tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-1.5 text-base">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
