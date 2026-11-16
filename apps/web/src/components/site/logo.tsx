import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  onClick?: () => void;
  asLink?: boolean;
}

export function Logo({ className, onClick, asLink = true }: LogoProps) {
  const content = (
    <>
      <span className="rounded-lg bg-primary px-2 py-1 font-display text-[21px] leading-none font-extrabold tracking-tight text-primary-foreground">
        NEZX
      </span>
      <span className="font-display text-[21px] leading-none font-extrabold tracking-tight">
        Academy
      </span>
    </>
  );

  const classes = cn("inline-flex items-center gap-2.5", className);

  if (!asLink) {
    return <span className={classes}>{content}</span>;
  }

  return (
    <Link to="/" onClick={onClick} className={classes} aria-label="NEZX Academy home">
      {content}
    </Link>
  );
}
