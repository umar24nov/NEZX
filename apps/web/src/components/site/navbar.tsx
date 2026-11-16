import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";

import { Logo } from "@/components/site/logo";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Home", href: "#top" },
  { label: "Courses", href: "#courses" },
  { label: "What you learn", href: "#learn" },
  { label: "Our work", href: "#work" },
  { label: "Results", href: "#results" },
  { label: "Contact", href: "#enquire" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pendingScroll = useRef<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleMobileNav = (href: string) => {
    // Radix keeps the page scroll-locked until the sheet has fully closed, so
    // remember the target and jump once the close animation releases the body.
    pendingScroll.current = href.replace("#", "");
    setOpen(false);
  };

  useEffect(() => {
    if (open || !pendingScroll.current) return;

    const id = pendingScroll.current;
    pendingScroll.current = null;
    const timer = window.setTimeout(() => {
      const target = document.getElementById(id);
      if (!target) return;
      target.scrollIntoView({ behavior: "instant", block: "start" });
      // Move focus with the viewport so keyboard and screen-reader users land
      // on the section they picked instead of the page top.
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [open]);

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[80] rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <nav
        className={cn(
          "sticky top-0 z-50 bg-ink text-white transition-shadow duration-300",
          scrolled && "shadow-[0_10px_30px_rgba(0,0,0,0.45)]",
        )}
      >
        <div className="wrap grid h-[68px] grid-cols-[1fr_auto] items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
          <Logo className="text-white" />

          <div className="hidden items-center gap-7 text-[14.5px] font-medium lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="border-b-2 border-transparent py-1.5 text-white/80 transition-colors hover:border-primary hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2">
            <ThemeToggle className="hidden text-white/80 hover:bg-white/10 hover:text-white sm:inline-flex" />
            <Button asChild className="hidden md:inline-flex">
              <a href="#enquire">Enquire now</a>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="mobile-menu"
            >
              <Menu className="size-5" />
            </Button>
          </div>
        </div>
      </nav>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          id="mobile-menu"
          side="right"
          className="border-white/15 bg-ink text-white"
        >
          <SheetHeader>
            <SheetTitle className="text-white">Menu</SheetTitle>
            <SheetDescription className="text-white/60">
              NEZX Academy — learn, launch, sell, grow.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col px-5 pb-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(event) => {
                  event.preventDefault();
                  handleMobileNav(link.href);
                }}
                className="border-b border-white/10 py-3.5 text-base text-white/85 transition-colors hover:text-primary"
              >
                {link.label}
              </a>
            ))}

            <Button
              className="mt-6 w-full"
              onClick={() => handleMobileNav("#enquire")}
            >
              Enquire now
            </Button>

            <div className="mt-8 flex items-center justify-between text-sm text-white/60">
              <span>Switch theme</span>
              <ThemeToggle className="text-white/80 hover:bg-white/10 hover:text-white" />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
