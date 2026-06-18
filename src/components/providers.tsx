"use client";

import { I18nProvider } from "@/lib/i18n/provider";
import { useStore } from "@/lib/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";

function StoreHydrator({ children }: { children: React.ReactNode }) {
  const hydrate = useStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
      }),
  );

  // Apply persisted theme as early as possible to avoid a flash.
  useEffect(() => {
    const saved = window.localStorage.getItem("mood.theme");
    const dark =
      saved === "dark" ||
      (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  return (
    <QueryClientProvider client={client}>
      <I18nProvider>
        <StoreHydrator>{children}</StoreHydrator>
      </I18nProvider>
    </QueryClientProvider>
  );
}
