import { ArrowUpRight, MapPin, MessageCircle, Phone } from "lucide-react";
import { Link } from "react-router-dom";

import type { SiteConfigDto } from "@nezx/shared";

import { Logo } from "@/components/site/logo";
import { ThemeToggle } from "@/components/site/theme-toggle";

const SITE_LINKS = [
  { label: "Courses", href: "/#courses" },
  { label: "What you learn", href: "/#learn" },
  { label: "Our work", href: "/#work" },
  { label: "Results", href: "/#results" },
  { label: "Enquire", href: "/#enquire" },
];

interface FooterProps {
  config: SiteConfigDto;
}

export function Footer({ config }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink pb-[max(28px,env(safe-area-inset-bottom))] text-white/65">
      <div className="wrap">
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Logo className="text-white" />
            <p className="mt-4 max-w-[34ch] text-sm leading-relaxed">
              Learn. Launch. Sell. Grow. Practical e-commerce training from Roorkee, Uttarakhand.
            </p>
            <a
              href={`https://wa.me/${config.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              <MessageCircle aria-hidden="true" className="size-4" />
              Chat on WhatsApp
            </a>
          </div>

          <nav aria-label="Footer" className="grid content-start gap-2.5 text-sm">
            {SITE_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="w-fit transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="grid content-start gap-3 text-sm">
            <a
              href={config.phoneHref}
              className="inline-flex w-fit items-center gap-2 transition-colors hover:text-primary"
            >
              <Phone aria-hidden="true" className="size-4" />
              {config.phone}
            </a>
            <p className="inline-flex items-start gap-2">
              <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>Roorkee, Uttarakhand</span>
            </p>
            <p className="text-white/45">{config.replyTime}</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-white/45">Theme</span>
              <ThemeToggle className="text-white/70 hover:bg-white/10 hover:text-white" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 py-5 text-[13px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <span>© {year} NEZX Academy. All rights reserved.</span>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>Online + offline classes</span>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1 transition-colors hover:text-primary"
            >
              Owner inbox
              <ArrowUpRight aria-hidden="true" className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
