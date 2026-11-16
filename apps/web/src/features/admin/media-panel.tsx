import { useRef, useState, type FormEvent } from "react";
import {
  Eye,
  EyeOff,
  Film,
  Image as ImageIcon,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

import type { MediaSection } from "@nezx/shared";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useAdminMedia,
  useDeleteMedia,
  useUpdateMedia,
  useUploadMedia,
  type AdminMedia,
} from "@/features/admin/api";
import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

const MAX_BYTES = 50 * 1024 * 1024;

function MediaThumb({ media }: { media: AdminMedia }) {
  if (media.type === "VIDEO" && !media.posterUrl) {
    return (
      <video
        src={media.url}
        muted
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
        aria-label={media.alt}
      />
    );
  }

  return (
    <img
      src={media.posterUrl ?? media.url}
      alt={media.alt}
      loading="lazy"
      className="h-full w-full object-cover"
    />
  );
}

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function UploadMediaDialog({ open, onOpenChange }: UploadDialogProps) {
  const upload = useUploadMedia();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [stat, setStat] = useState("");
  const [section, setSection] = useState<MediaSection>("RESULT");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setAlt("");
    setCaption("");
    setStat("");
    setSection("RESULT");
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!file) {
      setError("Choose an image or video to upload.");
      return;
    }
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setError("Only images and videos can be uploaded.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("The maximum file size is 50 MB.");
      return;
    }

    try {
      await upload.mutateAsync({
        file,
        alt: alt.trim(),
        caption: caption.trim() || undefined,
        stat: stat.trim() || undefined,
        section,
      });
      toast.success("Media uploaded and added to the gallery.");
      reset();
      onOpenChange(false);
    } catch (uploadError) {
      setError(apiErrorMessage(uploadError));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload media</DialogTitle>
          <DialogDescription>
            Files upload straight to Cloudflare R2. Images appear in results, videos in the work
            gallery.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <Label htmlFor="media-file">File</Label>
            <label
              htmlFor="media-file"
              className={cn(
                "mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-[1.5px] border-dashed border-border bg-muted/60 px-4 py-8 text-center transition-colors hover:border-primary",
                file && "border-primary/60 bg-primary/5",
              )}
            >
              <UploadCloud aria-hidden="true" className="size-6 text-muted-foreground" />
              <span className="mt-2 text-sm font-medium">
                {file ? file.name : "Click to choose an image or video"}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                JPG, PNG, WebP, MP4 or WebM · up to 50 MB
              </span>
            </label>
            <input
              ref={fileRef}
              id="media-file"
              type="file"
              accept="image/*,video/*"
              className="sr-only"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="media-section">Gallery</Label>
              <select
                id="media-section"
                value={section}
                onChange={(event) => setSection(event.target.value as MediaSection)}
                className="mt-2 flex h-11 w-full rounded-xl border-[1.5px] border-input bg-background px-3.5 text-sm outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20"
              >
                <option value="RESULT">Results (screenshots)</option>
                <option value="WORK">Our work (clips)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="media-stat">
                Stat <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="media-stat"
                value={stat}
                onChange={(event) => setStat(event.target.value)}
                maxLength={40}
                placeholder="₹81,80,143"
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="media-alt">Alt text</Label>
            <Input
              id="media-alt"
              required
              value={alt}
              onChange={(event) => setAlt(event.target.value)}
              maxLength={300}
              placeholder="Describe what the image or clip shows"
              className="mt-2"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Required for screen readers and search engines.
            </p>
          </div>

          <div>
            <Label htmlFor="media-caption">
              Caption <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="media-caption"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              maxLength={300}
              placeholder="Shown under the media item"
              className="mt-2"
            />
          </div>

          {error ? (
            <p role="alert" className="rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={upload.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={upload.isPending}>
              {upload.isPending ? (
                <>
                  <LoaderCircle aria-hidden="true" className="animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <UploadCloud aria-hidden="true" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditDialogProps {
  media: AdminMedia;
  onClose: () => void;
}

function EditMediaDialog({ media, onClose }: EditDialogProps) {
  const update = useUpdateMedia();
  const [alt, setAlt] = useState(media.alt);
  const [caption, setCaption] = useState(media.caption ?? "");
  const [stat, setStat] = useState(media.stat ?? "");
  const [sortOrder, setSortOrder] = useState(String(media.sortOrder));
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await update.mutateAsync({
        id: media.id,
        input: {
          alt: alt.trim(),
          caption: caption.trim() || null,
          stat: stat.trim() || null,
          sortOrder: Number(sortOrder) || 0,
        },
      });
      toast.success("Media updated.");
      onClose();
    } catch (updateError) {
      setError(apiErrorMessage(updateError));
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit media</DialogTitle>
          <DialogDescription>
            {media.type === "VIDEO" ? "Video clip" : "Image"} · {media.key}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <Label htmlFor="edit-alt">Alt text</Label>
            <Input
              id="edit-alt"
              required
              value={alt}
              onChange={(event) => setAlt(event.target.value)}
              maxLength={300}
              className="mt-2"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="edit-stat">
                Stat <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="edit-stat"
                value={stat}
                onChange={(event) => setStat(event.target.value)}
                maxLength={40}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="edit-order">Sort order</Label>
              <Input
                id="edit-order"
                type="number"
                min={0}
                max={999}
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-caption">
              Caption <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="edit-caption"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              maxLength={300}
              className="mt-2"
            />
          </div>

          {error ? (
            <p role="alert" className="rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={update.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={update.isPending || !alt.trim()}>
              {update.isPending ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface MediaCardProps {
  media: AdminMedia;
  onEdit: (media: AdminMedia) => void;
  onToggle: (media: AdminMedia) => void;
  onDelete: (media: AdminMedia) => void;
  toggling: boolean;
  deleting: boolean;
}

function MediaCard({ media, onEdit, onToggle, onDelete, toggling, deleting }: MediaCardProps) {
  const busy = toggling || deleting;

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <MediaThumb media={media} />
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          <Badge variant="outline" className="border-0 bg-black/65 text-white backdrop-blur">
            {media.type === "VIDEO" ? (
              <Film aria-hidden="true" className="size-3" />
            ) : (
              <ImageIcon aria-hidden="true" className="size-3" />
            )}
            {media.type === "VIDEO" ? "Video" : "Image"}
          </Badge>
          {!media.published ? (
            <Badge variant="warning" className="border-0">
              Hidden
            </Badge>
          ) : null}
        </div>
        <span className="absolute top-2.5 right-2.5 rounded-full bg-black/65 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
          #{media.sortOrder}
        </span>
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold">{media.alt}</h3>
        {media.caption ? (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{media.caption}</p>
        ) : null}
        {media.stat ? (
          <p className="mt-2 font-display text-lg font-extrabold text-foreground">{media.stat}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onToggle(media)}
            disabled={busy}
            className="h-8 px-2.5 text-xs"
          >
            {toggling ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            ) : media.published ? (
              <EyeOff aria-hidden="true" />
            ) : (
              <Eye aria-hidden="true" />
            )}
            {media.published ? "Hide" : "Publish"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onEdit(media)}
            disabled={busy}
            className="h-8 px-2.5 text-xs"
          >
            <Pencil aria-hidden="true" />
            Edit
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onDelete(media)}
            disabled={busy}
            className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            {deleting ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            ) : (
              <Trash2 aria-hidden="true" />
            )}
            Delete
          </Button>
        </div>
      </div>
    </article>
  );
}

export function MediaPanel() {
  const media = useAdminMedia();
  const update = useUpdateMedia();
  const remove = useDeleteMedia();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState<AdminMedia | null>(null);

  const handleToggle = (item: AdminMedia) => {
    update.mutate(
      { id: item.id, input: { published: !item.published } },
      {
        onSuccess: () =>
          toast.success(item.published ? "Media hidden from the site." : "Media published."),
        onError: (error) => toast.error(apiErrorMessage(error)),
      },
    );
  };

  const handleDelete = (item: AdminMedia) => {
    if (!window.confirm(`Delete “${item.alt}”? This also removes the file from storage.`)) return;

    remove.mutate(item.id, {
      onSuccess: () => toast.success("Media deleted."),
      onError: (error) => toast.error(apiErrorMessage(error)),
    });
  };

  const items = media.data ?? [];
  const groups: Array<{ section: MediaSection; label: string; items: AdminMedia[] }> = [
    {
      section: "RESULT",
      label: "Results gallery",
      items: items.filter((item) => item.section === "RESULT"),
    },
    {
      section: "WORK",
      label: "Work clips",
      items: items.filter((item) => item.section === "WORK"),
    },
  ];

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
        <div>
          <h2 className="font-display text-lg font-extrabold tracking-tight">Media gallery</h2>
          <p className="text-sm text-muted-foreground">
            {items.length} items · uploaded files live on Cloudflare R2
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <Plus aria-hidden="true" />
          Upload media
        </Button>
      </div>

      {media.isError ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <h3 className="text-lg font-bold">Could not load the media gallery.</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {apiErrorMessage(media.error)}
          </p>
          <Button variant="outline" className="mt-5" onClick={() => void media.refetch()}>
            Try again
          </Button>
        </div>
      ) : media.isPending ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-72 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.section} className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                {group.label}
              </h3>
              <span className="text-xs text-muted-foreground">{group.items.length}</span>
            </div>

            {group.items.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-card/50 px-5 py-8 text-center text-sm text-muted-foreground">
                Nothing here yet. Upload a file to add it.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {group.items.map((item) => (
                  <MediaCard
                    key={item.id}
                    media={item}
                    onEdit={setEditing}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    toggling={update.isPending && update.variables?.id === item.id}
                    deleting={remove.isPending && remove.variables === item.id}
                  />
                ))}
              </div>
            )}
          </section>
        ))
      )}

      <UploadMediaDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      {editing ? <EditMediaDialog media={editing} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}
