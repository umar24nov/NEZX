import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Inbox,
  LoaderCircle,
  Mail,
  MessageSquareText,
  Phone,
  RefreshCw,
  Search,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import {
  ENQUIRY_STATUSES,
  type EnquiryDto,
  type EnquiryStats,
  type EnquiryStatus,
  type UpdateEnquiryInput,
} from "@nezx/shared";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useAdminEnquiries,
  useEnquiryStats,
  useUpdateEnquiry,
  type EnquiryFilters,
} from "@/features/admin/api";
import { ApiError, apiErrorMessage } from "@/lib/api";
import { formatDate, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

const STATUS_META: Record<
  EnquiryStatus,
  { label: string; variant: "info" | "warning" | "success" | "secondary" }
> = {
  NEW: { label: "New", variant: "info" },
  CONTACTED: { label: "Contacted", variant: "warning" },
  ENROLLED: { label: "Enrolled", variant: "success" },
  CLOSED: { label: "Closed", variant: "secondary" },
};

export function statusBadge(status: EnquiryStatus) {
  const meta = STATUS_META[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

interface StatCardProps {
  icon: typeof Inbox;
  label: string;
  value: number | string;
  hint?: string;
}

function StatCard({ icon: Icon, label, value, hint }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
          {label}
        </span>
        <Icon aria-hidden="true" className="size-4 text-primary" />
      </div>
      <p className="mt-2 font-display text-3xl font-extrabold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function StatsRow({ stats }: { stats: EnquiryStats | undefined }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard icon={Inbox} label="Total" value={stats?.total ?? "—"} hint="All enquiries" />
      <StatCard icon={Sparkles} label="New" value={stats?.newCount ?? "—"} hint="Awaiting reply" />
      <StatCard
        icon={CalendarDays}
        label="Last 7 days"
        value={stats?.last7Days ?? "—"}
        hint="Recent activity"
      />
      <StatCard
        icon={UserCheck}
        label="Enrolled"
        value={stats?.byStatus.ENROLLED ?? "—"}
        hint="Converted students"
      />
    </div>
  );
}

interface EnquiryRowProps {
  enquiry: EnquiryDto;
  onUpdate: (id: string, input: UpdateEnquiryInput) => void;
  updating: boolean;
}

function EnquiryRow({ enquiry, onUpdate, updating }: EnquiryRowProps) {
  const [note, setNote] = useState(enquiry.adminNote ?? "");

  useEffect(() => {
    setNote(enquiry.adminNote ?? "");
  }, [enquiry.id, enquiry.adminNote]);

  const noteChanged = note.trim() !== (enquiry.adminNote ?? "").trim();

  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-extrabold tracking-tight">{enquiry.name}</h3>
            {statusBadge(enquiry.status)}
            <Badge variant="outline">
              {enquiry.mode === "ONLINE" ? "Online" : "Offline (Roorkee)"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {enquiry.courseLabel}
            <span aria-hidden="true"> · </span>
            <time dateTime={enquiry.createdAt} title={formatDate(enquiry.createdAt)}>
              {timeAgo(enquiry.createdAt)}
            </time>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {ENQUIRY_STATUSES.map((status) => (
            <Button
              key={status}
              type="button"
              size="sm"
              variant={enquiry.status === status ? "dark" : "outline"}
              disabled={updating || enquiry.status === status}
              onClick={() => onUpdate(enquiry.id, { status })}
              className="h-8 px-3 text-xs"
            >
              {STATUS_META[status].label}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <a
          href={`tel:${enquiry.phone.replace(/\s+/g, "")}`}
          className="inline-flex items-center gap-2 font-medium transition-colors hover:text-primary"
        >
          <Phone aria-hidden="true" className="size-4 text-muted-foreground" />
          {enquiry.phone}
        </a>
        {enquiry.email ? (
          <a
            href={`mailto:${enquiry.email}`}
            className="inline-flex items-center gap-2 font-medium transition-colors hover:text-primary"
          >
            <Mail aria-hidden="true" className="size-4 text-muted-foreground" />
            {enquiry.email}
          </a>
        ) : null}
      </div>

      {enquiry.message ? (
        <p className="mt-3 rounded-xl bg-muted px-4 py-3 text-sm leading-relaxed whitespace-pre-line">
          {enquiry.message}
        </p>
      ) : null}

      <details className="group mt-4">
        <summary className="inline-flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-muted-foreground transition-colors select-none hover:text-foreground">
          <MessageSquareText aria-hidden="true" className="size-4" />
          Private note
          {enquiry.adminNote ? (
            <Badge variant="secondary" className="ml-1">
              Saved
            </Badge>
          ) : null}
        </summary>

        <div className="mt-3">
          <label htmlFor={`note-${enquiry.id}`} className="sr-only">
            Private note for {enquiry.name}
          </label>
          <textarea
            id={`note-${enquiry.id}`}
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Batch discussed, follow-up date, fee quoted…"
            className="flex w-full rounded-xl border-[1.5px] border-input bg-background px-3.5 py-3 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20"
          />
          <div className="mt-2 flex items-center gap-3">
            <Button
              type="button"
              size="sm"
              disabled={!noteChanged || updating}
              onClick={() => onUpdate(enquiry.id, { adminNote: note.trim() || null })}
            >
              {updating ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
              Save note
            </Button>
            {noteChanged ? (
              <button
                type="button"
                onClick={() => setNote(enquiry.adminNote ?? "")}
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Discard
              </button>
            ) : null}
          </div>
        </div>
      </details>
    </article>
  );
}

function EnquiriesError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const forbidden = error instanceof ApiError && error.status === 403;
  const unauthenticated = error instanceof ApiError && error.status === 401;

  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center">
      <h3 className="text-lg font-bold">
        {forbidden
          ? "This account does not have owner access."
          : unauthenticated
            ? "Your session expired."
            : "Could not load enquiries."}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {forbidden
          ? "Ask the site owner to add your email to ADMIN_EMAIL, or sign in with the owner account."
          : unauthenticated
            ? "Sign in again to continue reading enquiries."
            : apiErrorMessage(error)}
      </p>
      <Button variant="outline" className="mt-5" onClick={onRetry}>
        <RefreshCw aria-hidden="true" />
        Try again
      </Button>
    </div>
  );
}

export function EnquiriesPanel() {
  const [status, setStatus] = useState<EnquiryStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);

  const filters: EnquiryFilters = useMemo(
    () => ({ status, q: deferredSearch, page, pageSize: PAGE_SIZE }),
    [status, deferredSearch, page],
  );

  const enquiries = useAdminEnquiries(filters);
  const stats = useEnquiryStats();
  const update = useUpdateEnquiry();

  useEffect(() => {
    setPage(1);
  }, [status, deferredSearch]);

  const handleUpdate = (id: string, input: UpdateEnquiryInput) => {
    update.mutate(
      { id, input },
      {
        onSuccess: () => toast.success("Enquiry updated."),
        onError: (error) => toast.error(apiErrorMessage(error)),
      },
    );
  };

  const total = enquiries.data?.total ?? 0;
  const pageCount = enquiries.data?.totalPages ?? 1;

  return (
    <div className="grid gap-6">
      <StatsRow stats={stats.data} />

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
          <Button
            type="button"
            size="sm"
            variant={status === "ALL" ? "dark" : "ghost"}
            onClick={() => setStatus("ALL")}
          >
            All
            {stats.data ? <span className="opacity-60">{stats.data.total}</span> : null}
          </Button>
          {ENQUIRY_STATUSES.map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={status === value ? "dark" : "ghost"}
              onClick={() => setStatus(value)}
            >
              {STATUS_META[value].label}
              {stats.data ? <span className="opacity-60">{stats.data.byStatus[value]}</span> : null}
            </Button>
          ))}
        </div>

        <div className="relative sm:w-64">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, phone, email…"
            aria-label="Search enquiries"
            className="h-10 pl-10"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {enquiries.isPending ? "Loading enquiries…" : `${total} ${total === 1 ? "enquiry" : "enquiries"}`}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void enquiries.refetch()}
          disabled={enquiries.isFetching}
        >
          <RefreshCw
            aria-hidden="true"
            className={cn(enquiries.isFetching && "animate-spin")}
          />
          Refresh
        </Button>
      </div>

      {enquiries.isError ? (
        <EnquiriesError error={enquiries.error} onRetry={() => void enquiries.refetch()} />
      ) : enquiries.isPending ? (
        <div className="grid gap-3" aria-label="Loading enquiries">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-40 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : enquiries.data && enquiries.data.items.length > 0 ? (
        <>
          <div className={cn("grid gap-3 transition-opacity", enquiries.isFetching && "opacity-70")}>
            {enquiries.data.items.map((enquiry) => (
              <EnquiryRow
                key={enquiry.id}
                enquiry={enquiry}
                onUpdate={handleUpdate}
                updating={update.isPending && update.variables?.id === enquiry.id}
              />
            ))}
          </div>

          {pageCount > 1 ? (
            <div className="flex items-center justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {pageCount}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= pageCount}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
          <Users aria-hidden="true" className="mx-auto size-8 text-muted-foreground" />
          <h3 className="mt-3 text-lg font-bold">No enquiries here yet.</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            {search || status !== "ALL"
              ? "Try clearing the search or status filter."
              : "New enquiries from the website will appear here automatically."}
          </p>
        </div>
      )}
    </div>
  );
}
