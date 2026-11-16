import type { ReactNode } from "react";

import { Reveal } from "@/components/site/reveal";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  tone?: "default" | "dark";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  tone = "default",
  className,
}: SectionHeadingProps) {
  const dark = tone === "dark";

  return (
    <div className={cn("max-w-3xl", className)}>
      <Reveal>
        <span className={cn("eyebrow", dark && "text-primary")}>{eyebrow}</span>
      </Reveal>
      <Reveal delay={60}>
        <h2 className="text-h2">{title}</h2>
      </Reveal>
      {lead ? (
        <Reveal delay={120}>
          <p
            className={cn(
              "mt-5 max-w-[58ch] text-[clamp(16px,1.6vw,19px)] leading-relaxed text-muted-foreground",
              dark && "text-white/70",
            )}
          >
            {lead}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}
