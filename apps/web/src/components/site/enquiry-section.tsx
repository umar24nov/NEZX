import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import {
  enquiryFormSchema,
  FALLBACK_COURSE_LABEL,
  normalizePhone,
  type CourseDto,
  type EnquiryFormInput,
  type EnquiryMode,
  type SiteConfigDto,
} from "@nezx/shared";

import { SectionHeading } from "@/components/site/section-heading";
import { TurnstileWidget } from "@/components/site/turnstile-widget";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useCreateEnquiry } from "@/features/enquiries/use-create-enquiry";
import { ApiError, apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { useEnquiryStore } from "@/stores/enquiry-store";

const UNSURE_SLUG = "unsure";
const FIELDS = ["name", "phone", "email", "courseSlug", "mode", "message"] as const;

interface EnquirySectionProps {
  courses: CourseDto[];
  config: SiteConfigDto;
}

interface SubmittedEnquiry {
  name: string;
  phone: string;
  email?: string;
  courseLabel: string;
  mode: EnquiryMode;
  message?: string;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-[13px] font-medium text-destructive">
      {message}
    </p>
  );
}


export function EnquirySection({ courses, config }: EnquirySectionProps) {
  const preferredCourseSlug = useEnquiryStore((state) => state.preferredCourseSlug);
  const clearPreferredCourse = useEnquiryStore((state) => state.clearPreferredCourse);
  const createEnquiry = useCreateEnquiry();

  const [website, setWebsite] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [submitted, setSubmitted] = useState<SubmittedEnquiry | null>(null);

  const defaultCourseSlug = courses[0]?.slug ?? UNSURE_SLUG;

  const form = useForm<EnquiryFormInput>({
    resolver: zodResolver(enquiryFormSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      courseSlug: defaultCourseSlug,
      mode: "ONLINE",
      message: "",
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const mode = watch("mode");
  const busy = isSubmitting || createEnquiry.isPending;

  // Course cards preselect the relevant course and then scroll here.
  useEffect(() => {
    if (!preferredCourseSlug) return;
    if (courses.some((course) => course.slug === preferredCourseSlug)) {
      setValue("courseSlug", preferredCourseSlug, { shouldValidate: true });
    }
    clearPreferredCourse();
  }, [preferredCourseSlug, courses, setValue, clearPreferredCourse]);

  const onVerify = useCallback((token: string | null) => setTurnstileToken(token), []);

  const whatsappHref = useMemo(() => {
    if (!submitted) return "#";
    return buildWhatsAppLink({
      whatsapp: config.whatsapp,
      greeting: config.whatsappGreeting,
      ...submitted,
    });
  }, [submitted, config.whatsapp, config.whatsappGreeting]);

  const onSubmit = handleSubmit(async (values) => {
    const courseLabel =
      courses.find((course) => course.slug === values.courseSlug)?.name ?? FALLBACK_COURSE_LABEL;

    try {
      await createEnquiry.mutateAsync({
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email?.trim() || undefined,
        courseSlug: values.courseSlug,
        mode: values.mode,
        message: values.message?.trim() || undefined,
        website: website || undefined,
        turnstileToken: turnstileToken ?? undefined,
      });

      setSubmitted({
        name: values.name.trim(),
        phone: normalizePhone(values.phone.trim()),
        email: values.email?.trim() || undefined,
        courseLabel,
        mode: values.mode,
        message: values.message?.trim() || undefined,
      });

      toast.success("Enquiry received. We will be in touch shortly.");
      reset({
        name: "",
        phone: "",
        email: "",
        courseSlug: defaultCourseSlug,
        mode: "ONLINE",
        message: "",
      });
      setWebsite("");
      setResetSignal((value) => value + 1);
    } catch (error) {
      if (error instanceof ApiError && error.details) {
        for (const field of FIELDS) {
          const message = error.details[field]?.[0];
          if (message) form.setError(field, { type: "server", message });
        }
      }
      toast.error(apiErrorMessage(error));
      setResetSignal((value) => value + 1);
    }
  });

  const startOver = () => {
    setSubmitted(null);
    setResetSignal((value) => value + 1);
    window.setTimeout(() => {
      document.getElementById("name")?.focus({ preventScroll: true });
    }, 0);
  };

  return (
    <section id="enquire" className="scroll-mt-20 bg-muted py-[clamp(64px,8vw,112px)]">
      <div className="wrap grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start lg:gap-[clamp(32px,5vw,64px)]">
        <div>
          <SectionHeading
            eyebrow="Enquire"
            title="Tell us what you want to sell."
            lead="Fill in the form and we will contact you with batch dates, fees and the right course for you."
          />

          <div className="mt-8 grid gap-4 text-[15px]">
            <div>
              <b className="block text-[12px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                Call / WhatsApp
              </b>
              <a
                href={config.phoneHref}
                className="mt-1 inline-flex items-center gap-2 font-semibold transition-colors hover:text-primary"
              >
                <Phone aria-hidden="true" className="size-4 text-primary" />
                {config.phone}
              </a>
            </div>
            <div>
              <b className="block text-[12px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                Location
              </b>
              <p className="mt-1 flex items-start gap-2">
                <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{config.location}</span>
              </p>
            </div>
            <div>
              <b className="block text-[12px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                Reply time
              </b>
              <p className="mt-1 flex items-start gap-2">
                <Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{config.replyTime}</span>
              </p>
            </div>
          </div>

          <a
            href={`https://wa.me/${config.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <MessageCircle aria-hidden="true" className="size-4" />
            Prefer WhatsApp? Message us directly
          </a>
        </div>

        <div className="rounded-[22px] border border-border bg-card p-[clamp(20px,3vw,34px)] shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
          {submitted ? (
            <div aria-live="polite">
              <div className="animate-pop grid size-14 place-items-center rounded-full bg-primary text-primary-foreground">
                <CheckCircle2 aria-hidden="true" className="size-7" strokeWidth={2.5} />
              </div>
              <h3 className="mt-4 text-2xl">Enquiry received</h3>
              <p className="mt-2.5 leading-relaxed text-muted-foreground">
                Thank you, {submitted.name.split(" ")[0]}. We will contact you on {submitted.phone}.
                You can also message us on WhatsApp for a faster reply.
              </p>

              <dl className="mt-5 grid gap-2 rounded-xl bg-muted p-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Course</dt>
                  <dd className="text-right font-medium">{submitted.courseLabel}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Mode</dt>
                  <dd className="text-right font-medium">
                    {submitted.mode === "ONLINE" ? "Online" : "Offline (Roorkee)"}
                  </dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                    <MessageCircle aria-hidden="true" />
                    Send on WhatsApp
                  </a>
                </Button>
                <Button variant="outline" onClick={startOver}>
                  New enquiry
                </Button>
              </div>
              <p className="mt-4 text-[13px] text-muted-foreground">
                Your enquiry is saved. WhatsApp is optional and gives you a faster reply.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate aria-describedby="form-privacy">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <input
                    id="name"
                    autoComplete="name"
                    placeholder="Your name"
                    className="mt-2 flex h-12 w-full rounded-xl border-[1.5px] border-input bg-background px-3.5 text-base outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 aria-invalid:border-destructive"
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "error-name" : undefined}
                    {...register("name")}
                  />
                  <FieldError id="error-name" message={errors.name?.message} />
                </div>

                <div>
                  <Label htmlFor="phone">Phone / WhatsApp</Label>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="10-digit number"
                    className="mt-2 flex h-12 w-full rounded-xl border-[1.5px] border-input bg-background px-3.5 text-base outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 aria-invalid:border-destructive"
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? "error-phone" : undefined}
                    {...register("phone")}
                  />
                  <FieldError id="error-phone" message={errors.phone?.message} />
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="email">
                  Email <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="mt-2 flex h-12 w-full rounded-xl border-[1.5px] border-input bg-background px-3.5 text-base outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 aria-invalid:border-destructive"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "error-email" : undefined}
                  {...register("email")}
                />
                <FieldError id="error-email" message={errors.email?.message} />
              </div>

              {/* Honeypot: hidden from people, irresistible to bots. */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="website">Leave empty</label>
                <input
                  id="website"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                />
              </div>

              <div className="mt-4">
                <Label htmlFor="courseSlug">Course you are interested in</Label>
                <select
                  id="courseSlug"
                  className="mt-2 flex h-12 w-full rounded-xl border-[1.5px] border-input bg-background px-3.5 text-base outline-none transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 aria-invalid:border-destructive"
                  aria-invalid={Boolean(errors.courseSlug)}
                  aria-describedby={errors.courseSlug ? "error-course" : undefined}
                  {...register("courseSlug")}
                >
                  {courses.map((course) => (
                    <option key={course.slug} value={course.slug}>
                      {course.name}
                    </option>
                  ))}
                  <option value={UNSURE_SLUG}>{FALLBACK_COURSE_LABEL}</option>
                </select>
                <FieldError id="error-course" message={errors.courseSlug?.message} />
              </div>

              <fieldset className="mt-4">
                <legend className="text-sm font-semibold">Preferred mode</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(
                    [
                      { value: "ONLINE", label: "Online" },
                      { value: "OFFLINE", label: "Offline (Roorkee)" },
                    ] as const
                  ).map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        "cursor-pointer rounded-xl border-[1.5px] border-border bg-background px-5 py-3 text-[15px] font-medium transition-colors",
                        "has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-primary/30",
                        mode === option.value &&
                          "border-primary bg-primary text-primary-foreground",
                      )}
                    >
                      <input
                        type="radio"
                        value={option.value}
                        className="sr-only"
                        {...register("mode")}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="mt-4">
                <Label htmlFor="message">
                  Message <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <textarea
                  id="message"
                  rows={4}
                  placeholder="Anything we should know? For example your product idea or preferred timing."
                  className="mt-2 flex min-h-28 w-full rounded-xl border-[1.5px] border-input bg-background px-3.5 py-3 text-base outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 aria-invalid:border-destructive"
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? "error-message" : undefined}
                  {...register("message")}
                />
                <FieldError id="error-message" message={errors.message?.message} />
              </div>

              <TurnstileWidget onVerify={onVerify} resetSignal={resetSignal} />

              <Button type="submit" size="lg" className="mt-6 w-full" disabled={busy}>
                {busy ? (
                  <>
                    <LoaderCircle aria-hidden="true" className="animate-spin" />
                    Sending enquiry…
                  </>
                ) : (
                  <>
                    <Send aria-hidden="true" />
                    Send enquiry
                  </>
                )}
              </Button>

              <p id="form-privacy" className="mt-3 text-[13px] text-muted-foreground">
                We use your details only to reply to this enquiry.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
