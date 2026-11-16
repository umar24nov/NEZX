import { Check } from "lucide-react";

import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/ui/button";
import { useEnquiryStore } from "@/stores/enquiry-store";
import type { CourseDto } from "@nezx/shared";

interface CoursesProps {
  courses: CourseDto[];
}

export function Courses({ courses }: CoursesProps) {
  const setPreferredCourse = useEnquiryStore((state) => state.setPreferredCourse);

  const enquireAbout = (slug: string) => {
    setPreferredCourse(slug);
    document.getElementById("enquire")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="courses" className="scroll-mt-20 py-[clamp(64px,8vw,112px)]">
      <div className="wrap">
        <SectionHeading
          eyebrow="Courses"
          title="Choose your selling platform."
          lead="Four complete programs. Each one takes you from account setup to your first orders."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {courses.map((course, index) => (
            <Reveal key={course.slug} delay={(index % 4) * 70}>
              <article className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)]">
                <h3 className="text-[19px] leading-tight">{course.name}</h3>
                <p className="mt-1.5 text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                  {course.tagline}
                </p>

                <ul className="mt-5 grid gap-2.5 text-sm">
                  {course.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-primary"
                        strokeWidth={3}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-6">
                  <Button className="w-full" onClick={() => enquireAbout(course.slug)}>
                    Enquire about this
                  </Button>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
