"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { AdminAuthShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export default function AdminLoginPage() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setIsPending(true);
    setError(null);
    try {
      const result = await authClient.signIn.social({ provider: "google", callbackURL: "/admin" });
      if (result.error) throw new Error("Sign-in failed");
    } catch {
      setError("Tidak dapat masuk. Coba lagi.");
      setIsPending(false);
    }
  }

  return (
    <AdminAuthShell title="Masuk ke admin">
      <Button
        type="button"
        variant="outline"
        className="h-12 w-full border-brand-200 bg-background text-foreground shadow-none hover:bg-brand-50"
        onClick={signIn}
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : (
          <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="var(--provider-google-blue)" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z" />
            <path fill="var(--provider-google-green)" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z" />
            <path fill="var(--provider-google-yellow)" d="M6.41 13.92a6 6 0 0 1 0-3.84V7.49H3.07a10 10 0 0 0 0 9.02l3.34-2.59Z" />
            <path fill="var(--provider-google-red)" d="M12 5.96c1.47 0 2.79.51 3.83 1.51l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.93 5.49l3.34 2.59C7.2 7.72 9.4 5.96 12 5.96Z" />
          </svg>
        )}
        {isPending ? "Menghubungkan..." : "Lanjut dengan Google"}
      </Button>
      {error ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}
      <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">Akun baru memerlukan persetujuan admin sebelum mendapat akses.</p>
    </AdminAuthShell>
  );
}
