import { useState, type FormEvent } from "react";
import { ArrowLeft, LoaderCircle, LockKeyhole } from "lucide-react";

import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function AdminSignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const result = await authClient.signIn.email({ email: email.trim(), password });
      if (result.error) {
        setError(
          result.error.message ??
            "Could not sign in. Check your email and password, then try again.",
        );
      }
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-ink px-4 py-12 text-white">
      <div className="w-full max-w-md">
        <div className="flex justify-center">
          <Logo className="text-white" />
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.045] p-6 shadow-2xl sm:p-8">
          <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
            <LockKeyhole aria-hidden="true" className="size-5" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">
            Owner sign-in
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/60">
            Sign in with the owner account to read enquiries and manage the media gallery.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <div>
              <Label htmlFor="admin-email" className="text-white/80">
                Email
              </Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 border-white/15 bg-white/5 text-white placeholder:text-white/35"
                placeholder="owner@nezxacademy.com"
              />
            </div>

            <div>
              <Label htmlFor="admin-password" className="text-white/80">
                Password
              </Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                minLength={10}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 border-white/15 bg-white/5 text-white placeholder:text-white/35"
                placeholder="At least 10 characters"
              />
            </div>

            {error ? (
              <p role="alert" className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm text-red-200">
                {error}
              </p>
            ) : null}

            <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
              {pending ? (
                <>
                  <LoaderCircle aria-hidden="true" className="animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="mt-4 text-[13px] leading-relaxed text-white/45">
            Owner access only. Enquiries submitted through the website are private.
          </p>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-white/55 transition-colors hover:text-white"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to the website
          </a>
        </div>
      </div>
    </main>
  );
}
