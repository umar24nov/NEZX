import { useEffect } from "react";

import type { SitePayload } from "@nezx/shared";
import { DEFAULT_SITE } from "@nezx/shared";

import { Audience } from "@/components/site/audience";
import { Courses } from "@/components/site/courses";
import { Curriculum } from "@/components/site/curriculum";
import { EnquirySection } from "@/components/site/enquiry-section";
import { Footer } from "@/components/site/footer";
import { Hero } from "@/components/site/hero";
import { Marquee } from "@/components/site/marquee";
import { Navbar } from "@/components/site/navbar";
import { Results } from "@/components/site/results";
import { Work } from "@/components/site/work";
import { useSite } from "@/features/site/use-site";

interface HomePageProps {
  site: SitePayload;
}

export function HomePage({ site }: HomePageProps) {
  useEffect(() => {
    document.title = "NEZX Academy — Turn your skills into an online business";
  }, []);

  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <Marquee />
        <Courses courses={site.courses} />
        <Curriculum modules={site.modules} steps={site.steps} />
        <Work work={site.work} />
        <Results results={site.results} note={site.config.resultsNote} />
        <Audience audience={site.audience} config={site.config} />
        <EnquirySection courses={site.courses} config={site.config} />
      </main>
      <Footer config={site.config} />
    </>
  );
}

/** Route component: keeps data fetching inside the page and out of App. */
export function HomeRoute() {
  const { data } = useSite();
  return <HomePage site={data ?? DEFAULT_SITE} />;
}
