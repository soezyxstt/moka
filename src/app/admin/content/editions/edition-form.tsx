"use client";

import { useTransition, type ReactNode } from "react";
import { toast } from "sonner";

export function EditionForm({ action, children, className }: { action: (data: FormData) => Promise<void>; children: ReactNode; className?: string }) {
  const [pending, startTransition] = useTransition();
  return <form className={className} aria-busy={pending} onSubmit={(event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        await action(data);
        toast.success("Perubahan edisi disimpan");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Perubahan gagal disimpan");
      }
    });
  }}><fieldset disabled={pending} className="contents">{children}</fieldset></form>;
}
