import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminIcon, type AdminIconName } from "./icons";
import { Loader2 } from "lucide-react";

export const adminInputClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-base md:text-sm text-foreground shadow-none outline-none transition-colors placeholder:text-muted-foreground focus:border-brand-300 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground";

export const adminTextareaClassName =
  "min-h-28 w-full rounded-md border border-input bg-background px-3 py-2.5 text-base md:text-sm text-foreground shadow-none outline-none transition-colors placeholder:text-muted-foreground focus:border-brand-300 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground";

export function AdminPage({
  title,
  description,
  action,
  children,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-brand-50/30 px-4 py-4 sm:px-6 sm:py-6 lg:px-10">
      <div className="mx-auto w-full min-w-0 max-w-[1440px]">
        {title || description || action ? (
          <header className="mb-4 sm:mb-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 max-w-3xl">
                {title ? (
                  <h1 className="break-words font-manrope !text-2xl font-semibold leading-tight tracking-[-0.03em] text-brand-900 sm:!text-3xl">
                    {title}
                  </h1>
                ) : null}
                {description ? (
                  <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
                ) : null}
              </div>
              {action ? <div className="shrink-0">{action}</div> : null}
            </div>
          </header>
        ) : null}
        {children}
      </div>
    </main>
  );
}

export function AdminCard({ className, padding = "default", ...props }: React.ComponentProps<typeof Card> & { padding?: "default" | "none" }) {
  // Cards own their interior spacing by default; full-bleed callers opt out with p-0 and gap-0.
  return <Card className={cn("gap-0 rounded-xl border border-brand-100 bg-card text-card-foreground shadow-none", padding === "none" ? "p-0" : "p-5 sm:p-6", className)} {...props} />;
}

export function AdminCardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 max-w-2xl">
        <h2 className="font-manrope text-lg font-semibold leading-snug text-brand-900">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="w-full shrink-0 sm:w-auto">{action}</div> : null}
    </div>
  );
}

export function AdminField({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block space-y-2", className)}>
      <span className="block text-sm font-semibold text-foreground">{label}</span>
      {children}
      {hint ? <span className="block text-xs leading-5 text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function AdminInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <Input className={cn(adminInputClassName, className)} {...props} />;
}

export function AdminTextarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <Textarea className={cn(adminTextareaClassName, className)} {...props} />;
}

export function AdminButton({
  variant = "primary",
  className,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
}) {
  return (
    <Button
      variant={variant === "danger" ? "destructive" : variant === "secondary" ? "outline" : "default"}
      disabled={disabled || loading}
      className={cn(
        "h-10 rounded-md px-4 text-sm font-semibold shadow-none transition-colors focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-brand text-canvas hover:bg-brand-600 focus-visible:ring-brand-100",
        variant === "secondary" && "border-brand-100 bg-canvas text-brand-700 hover:border-brand-200 hover:bg-brand-50 focus-visible:ring-brand-100",
        variant === "danger" && "bg-destructive text-canvas hover:bg-destructive/90",
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin shrink-0" /> : null}
      {children}
    </Button>
  );
}

export function AdminLinkButton({ href, children, variant = "primary", className }: { href: string; children: ReactNode; variant?: "primary" | "secondary"; className?: string }) {
  return (
    <Button
      asChild
      variant={variant === "primary" ? "default" : "outline"}
      className={cn(
        "h-10 rounded-md px-4 text-sm font-semibold shadow-none transition-colors focus-visible:ring-2",
        variant === "primary" && "bg-brand text-canvas hover:bg-brand-600 focus-visible:ring-brand-100",
        variant === "secondary" && "border-brand-100 bg-canvas text-brand-700 hover:border-brand-200 hover:bg-brand-50 focus-visible:ring-brand-100",
        className,
      )}
    >
      <Link href={href}>{children}</Link>
    </Button>
  );
}

// Status is plain text with a leading dot; no filled pill so lists stay quiet.
const badgeStyles: Record<string, string> = {
  active: "text-brand-700 before:bg-brand",
  approved: "text-brand-700 before:bg-brand",
  ready: "text-brand-700 before:bg-brand",
  published: "text-brand-700 before:bg-brand",
  draft: "text-highlight-800 before:bg-highlight-500",
  open: "text-highlight-800 before:bg-highlight-500",
  pending: "text-highlight-800 before:bg-highlight-500",
  closed: "text-muted-foreground before:bg-muted-foreground",
  inactive: "text-muted-foreground before:bg-muted-foreground",
  archived: "text-muted-foreground before:bg-muted-foreground",
  rejected: "text-danger-700 before:bg-danger-700",
  suspended: "text-danger-700 before:bg-danger-700",
};

const badgeLabels: Record<string, string> = {
  active: "Aktif",
  approved: "Disetujui",
  archived: "Arsip",
  closed: "Ditutup",
  draft: "Draf",
  inactive: "Nonaktif",
  open: "Terbuka",
  pending: "Menunggu",
  published: "Terbit",
  ready: "Siap",
  rejected: "Ditolak",
  suspended: "Ditangguhkan",
};

export function AdminBadge({ value, className }: { value: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-medium before:size-1.5 before:shrink-0 before:rounded-full before:content-['']",
        badgeStyles[value.toLowerCase()] ?? "text-brand-700 before:bg-brand",
        className,
      )}
    >
      {badgeLabels[value.toLowerCase()] ?? value.replaceAll("_", " ")}
    </span>
  );
}

export function AdminStatCard({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="border-t border-brand-100 py-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-manrope text-3xl font-semibold tracking-[-0.04em] text-brand-900">{value}</p>
      {note ? <p className="mt-1 text-xs text-muted-foreground">{note}</p> : null}
    </div>
  );
}

// Flat grouping for page regions: heading plus a top rule, no surface. Prefer this over AdminCard
// unless the content genuinely needs to read as a separate object.
export function AdminSection({
  title,
  description,
  action,
  className,
  children,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("border-t border-brand-100 pt-5", className)}>
      {title || action ? (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title ? <h2 className="font-manrope text-base font-semibold text-brand-900">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function AdminEmptyState({ icon = "folder", title, description }: { icon?: AdminIconName; title: string; description?: string }) {
  return (
    <div className="border-y border-dashed border-brand-200 bg-brand-50/30 px-5 py-8 text-center">
      <span className="mx-auto grid size-11 place-items-center rounded-md border border-brand-100 bg-canvas text-brand">
        <AdminIcon name={icon} size={19} />
      </span>
      <h3 className="mt-4 font-manrope text-base font-semibold text-brand-900">{title}</h3>
      {description ? <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p> : null}
    </div>
  );
}

export function AdminListRow({ title, meta, action, children }: { title: ReactNode; meta?: ReactNode; action?: ReactNode; children?: ReactNode }) {
  return (
    <article className="flex flex-col gap-4 border-b border-brand-100 px-2 py-4 transition-colors hover:bg-brand-50/35 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-manrope text-sm font-semibold text-brand-900">{title}</h3>
        {meta ? <div className="mt-1 text-xs text-muted-foreground">{meta}</div> : null}
        {children ? <div className="mt-3">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </article>
  );
}

export {
  AdminMediaPicker,
  AdminMediaField,
  AdminMediaPreview,
  type AdminMediaPickerProps,
  type AdminMediaFieldProps,
  type MediaAssetSummary,
  type MediaFolderSummary,
} from "./media-picker";

export { AdminSelect, type AdminSelectOption, type AdminSelectProps } from "./admin-select";

