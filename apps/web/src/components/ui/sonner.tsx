import { Toaster as SonnerToaster } from "sonner";

import { useThemeStore } from "@/stores/theme-store";

function Toaster() {
  const theme = useThemeStore((state) => state.theme);

  return (
    <SonnerToaster
      theme={theme}
      position="top-center"
      closeButton
      richColors
      toastOptions={{
        classNames: {
          toast: "rounded-xl border-border",
        },
      }}
    />
  );
}

export { Toaster };
