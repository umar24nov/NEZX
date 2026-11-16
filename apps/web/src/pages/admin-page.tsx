import { useEffect } from "react";
import { ExternalLink, LogOut, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { Logo } from "@/components/site/logo";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnquiriesPanel } from "@/features/admin/enquiries-panel";
import { MediaPanel } from "@/features/admin/media-panel";
import { AdminSignIn } from "@/features/admin/sign-in";
import { authClient, sessionRole, type OwnerSessionUser } from "@/lib/auth-client";

export function AdminPage() {
  const { data, isPending } = authClient.useSession();
  const user = data?.user as OwnerSessionUser | undefined;
  const role = sessionRole(user);

  useEffect(() => {
    const previous = document.title;
    document.title = "Owner dashboard — NEZX Academy";
    return () => {
      document.title = previous;
    };
  }, []);

  async function handleSignOut() {
    await authClient.signOut();
  }

  if (isPending) {
    return (
      <main className="grid min-h-dvh place-items-center bg-ink text-white">
        <div className="flex flex-col items-center gap-4">
          <Logo className="text-white" />
          <p className="text-sm text-white/50">Checking your session…</p>
        </div>
      </main>
    );
  }

  if (!user) return <AdminSignIn />;

  return (
    <div className="min-h-dvh bg-muted">
      <header className="sticky top-0 z-40 bg-ink text-white">
        <div className="wrap flex h-16 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Logo className="text-white" />
            <span className="hidden rounded-full border border-white/15 px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] text-white/60 uppercase sm:inline">
              Owner dashboard
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="mr-2 hidden max-w-52 truncate text-sm text-white/55 lg:inline">
              {user.email}
            </span>
            <ThemeToggle className="text-white/75 hover:bg-white/10 hover:text-white" />
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden text-white/75 hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              <Link to="/">
                <ExternalLink aria-hidden="true" />
                View site
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-white/25 text-white hover:bg-white/10"
              onClick={() => void handleSignOut()}
            >
              <LogOut aria-hidden="true" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main id="main" className="wrap py-8 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow text-primary">Owner only</span>
            <h1 className="text-h2">Enquiry inbox</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Read every enquiry from the website, track its status and keep private notes. Media
              you upload appears on the landing page immediately.
            </p>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold text-muted-foreground">
            <ShieldCheck aria-hidden="true" className="size-4 text-emerald-600 dark:text-emerald-400" />
            {role === "admin" ? "Admin role" : "Allowlisted owner"}
          </span>
        </div>

        <Tabs defaultValue="enquiries" className="mt-8">
          <TabsList>
            <TabsTrigger value="enquiries">Enquiries</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
          </TabsList>

          <TabsContent value="enquiries">
            <EnquiriesPanel />
          </TabsContent>
          <TabsContent value="media">
            <MediaPanel />
          </TabsContent>
        </Tabs>

        <p className="mt-10 text-xs text-muted-foreground">
          Signed in as {user.name} ({user.email}). This dashboard is protected by Better Auth
          sessions and server-side admin checks.
        </p>
      </main>
    </div>
  );
}
