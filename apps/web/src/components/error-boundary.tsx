import { Component, type ErrorInfo, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unexpected UI error", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="grid min-h-dvh place-items-center bg-background px-6 py-16">
        <div className="max-w-md text-center">
          <p className="eyebrow">Something broke</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight">
            This page hit an unexpected error.
          </h1>
          <p className="mt-4 text-muted-foreground">
            Reload the page to try again. If it keeps happening, contact us on WhatsApp.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button onClick={() => window.location.reload()}>Reload page</Button>
            <Button variant="outline" asChild>
              <a href="/">Back to home</a>
            </Button>
          </div>
        </div>
      </main>
    );
  }
}
