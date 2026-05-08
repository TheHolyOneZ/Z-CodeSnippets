import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { DropZone } from "@/components/dropzone/DropZone";
import { useUiStore, ACCENT_PRESETS } from "@/store/ui";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 30 },
  },
});

function ThemeApplier() {
  const { accentPresetId } = useUiStore();

  useEffect(() => {
    const preset =
      ACCENT_PRESETS.find((p) => p.id === accentPresetId) ?? ACCENT_PRESETS[0];
    const root = document.documentElement;
    root.style.setProperty("--color-accent",        preset.color);
    root.style.setProperty("--color-accent-hover",  preset.hover);
    root.style.setProperty("--color-accent-press",  preset.press);
    root.style.setProperty("--color-accent-subtle", preset.subtle);
    root.style.setProperty("--color-accent-soft",   preset.soft);
    root.style.setProperty("--color-accent-border", preset.border);
    root.style.setProperty("--color-accent-glow",   preset.glow);
  }, [accentPresetId]);

  return null;
}


function NativeContextMenuSuppressor() {
  useEffect(() => {
    const onContext = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t) return;
      if (t.closest(".monaco-editor")) return;
      if (t.closest("[data-allow-native-menu]")) return;
      e.preventDefault();
    };
    window.addEventListener("contextmenu", onContext);
    return () => window.removeEventListener("contextmenu", onContext);
  }, []);
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeApplier />
      <NativeContextMenuSuppressor />
      <AppShell />
      <DropZone />
      <Toaster
        theme="dark"
        position="bottom-right"
        offset={16}
        gap={8}
        toastOptions={{
          duration: 3000,
          classNames: {
            toast: "z-toast",
            title: "z-toast-title",
            description: "z-toast-desc",
          },
          style: {
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-float)",
          },
        }}
      />
    </QueryClientProvider>
  );
}
