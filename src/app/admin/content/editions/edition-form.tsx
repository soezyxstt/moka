"use client";

import { useTransition, type ReactNode } from "react";
import { toast } from "sonner";

export function EditionForm({
  action,
  children,
  className,
  loadingLabel = "Menyimpan perubahan edisi...",
  successLabel = "Perubahan edisi disimpan",
}: {
  action: (data: FormData) => Promise<void>;
  children: ReactNode;
  className?: string;
  loadingLabel?: string;
  successLabel?: string;
}) {
  const [pending, startTransition] = useTransition();
  return <form className={className} aria-busy={pending} onSubmit={(event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const toastId = toast.loading(loadingLabel);
    startTransition(async () => {
      try {
        await action(data);
        toast.success(successLabel, { id: toastId });
      } catch (error) {
        if (typeof error === "object" && error !== null && "digest" in error && typeof (error as { digest: unknown }).digest === "string" && (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")) {
          toast.dismiss(toastId);
          throw error;
        }
        toast.error(error instanceof Error ? error.message : "Perubahan gagal disimpan", { id: toastId });
      }
    });
  }}><fieldset disabled={pending} className="contents">{children}</fieldset></form>;
}
