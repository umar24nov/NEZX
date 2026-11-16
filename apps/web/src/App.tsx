import { lazy, Suspense, useEffect } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";

import { Logo } from "@/components/site/logo";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { Button } from "@/components/ui/button";
import { HomeRoute } from "@/pages/home-page";

// The admin dashboard is owner-only and heavy (forms, tables, auth), so keep it
// out of the public landing-page bundle and load it on demand.
const AdminPage = lazy(() =>
  import("@/pages/admin-page").then((module) => ({ default: module.AdminPage })),
);

/** Keeps deep links like /#courses working with client-side routing. */
function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (pathname !== "/" || !hash) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    const id = decodeURIComponent(hash.slice(1));
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [pathname, hash]);

  return null;
}

function NotFoundPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-ink px-6 py-16 text-white">
      <div className="max-w-md text-center">
        <Logo className="justify-center text-white" />
        <p className="eyebrow mt-8 text-primary">404</p>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight">
          This page does not exist.
        </h1>
        <p className="mt-3 text-white/60">
          The link may be old. Head back to the courses or send us an enquiry.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/">Back to home</Link>
          </Button>
          <Button asChild variant="outline" className="border-white/30 text-white hover:bg-white/10">
            <Link to="/#enquire">Enquire</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

export function App() {
  return (
    <>
      <ScrollProgress />
      <ScrollToHash />
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route
          path="/admin"
          element={
            <Suspense
              fallback={
                <main className="grid min-h-dvh place-items-center bg-ink text-white">
                  <div className="flex flex-col items-center gap-4">
                    <Logo className="text-white" />
                    <p className="text-sm text-white/50">Loading dashboard…</p>
                  </div>
                </main>
              }
            >
              <AdminPage />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
