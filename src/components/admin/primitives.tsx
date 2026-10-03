import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminIcon, type AdminIconName } from "./icons";

export const adminInputClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-none outline-none transition-colors placeholder:text-muted-foreground focus:border-dgb-300 focus:ring-2 focus:ring-dgb-100 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground";

export const adminTextareaClassName =
  "min-h-28 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-none outline-none transition-colors placeholder:text-muted-foreground focus:border-dgb-300 focus:ring-2 focus:ring-dgb-100 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground";

export function AdminPage({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-[1440px]">
        <header className="mb-5 border-b border-border/70 pb-3 sm:mb-6 sm:pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 max-w-3xl">
              {eyebrow ? (
                <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-fb-600">
                  <span className="h-3 w-0.5 bg-fb" aria-hidden="true" />
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="break-words font-montserrat !text-2xl font-semibold leading-tight tracking-[-0.03em] text-dgb-900 sm:!text-3xl">{title}</h1>
              {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}

export function AdminCard({ className, padding = "default", ...props }: React.ComponentProps<typeof Card> & { padding?: "default" | "none" }) {
  // Cards own their interior spacing by default; full-bleed callers opt out with p-0 and gap-0.
  return <Card className={cn("gap-0 rounded-xl border border-dgb-100 bg-card text-card-foreground shadow-none", padding === "none" ? "p-0" : "p-5 sm:p-6", className)} {...props} />;
}

export function AdminCardHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 max-w-2xl">
        {eyebrow ? <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-fb-600">{eyebrow}</p> : null}
        <h2 className="font-montserrat text-lg font-semibold leading-snug text-dgb-900">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="w-full shrink-0 sm:w-auto">{action}</div> : null}
    </div>
  );
}

export function AdminField({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block space-y-2", className)}>
      <span className="block text-xs font-semibold text-foreground">{label}</span>
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
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  return (
    <Button
      variant={variant === "danger" ? "destructive" : variant === "secondary" ? "outline" : "default"}
      className={cn(
        "h-10 rounded-md px-4 text-sm font-semibold shadow-none transition-colors focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-dgb text-white hover:bg-dgb-600 focus-visible:ring-dgb-100",
        variant === "secondary" && "border-dgb-100 bg-white text-dgb-700 hover:border-dgb-200 hover:bg-dgb-50 focus-visible:ring-dgb-100",
        variant === "danger" && "bg-destructive text-white hover:bg-destructive/90",
        className,
      )}
      {...props}
    />
  );
}

export function AdminLinkButton({ href, children, variant = "primary", className }: { href: string; children: ReactNode; variant?: "primary" | "secondary"; className?: string }) {
  return (
    <Button
      asChild
      variant={variant === "primary" ? "default" : "outline"}
      className={cn(
        "h-10 rounded-md px-4 text-sm font-semibold shadow-none transition-colors focus-visible:ring-2",
        variant === "primary" && "bg-dgb text-white hover:bg-dgb-600 focus-visible:ring-dgb-100",
        variant === "secondary" && "border-dgb-100 bg-white text-dgb-700 hover:border-dgb-200 hover:bg-dgb-50 focus-visible:ring-dgb-100",
        className,
      )}
    >
      <Link href={href}>{children}</Link>
    </Button>
  );
}

const badgeStyles: Record<string, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  draft: "border-amber-200 bg-amber-50 text-amber-800",
  open: "border-amber-200 bg-amber-50 text-amber-800",
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  closed: "border-border bg-muted text-muted-foreground",
  inactive: "border-border bg-muted text-muted-foreground",
  archived: "border-border bg-muted text-muted-foreground",
  rejected: "border-red-200 bg-red-50 text-red-700",
  suspended: "border-red-200 bg-red-50 text-red-700",
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
    <Badge variant="outline" className={cn("rounded-sm border-l-2 px-2 py-0.5 text-[11px] font-semibold capitalize", badgeStyles[value.toLowerCase()] ?? "border-dgb-200 bg-dgb-50 text-dgb-700", className)}>
      {badgeLabels[value.toLowerCase()] ?? value.replaceAll("_", " ")}
    </Badge>
  );
}

export function AdminStatCard({
  label,
  value,
  note,
  icon,
  accent = "green",
}: {
  label: string;
  value: string | number;
  note: string;
  icon: AdminIconName;
  accent?: "green" | "gold" | "blue";
}) {
  return (
    <div className="relative border-t border-dgb-100 py-5 sm:px-5">
      <div className={cn("absolute left-0 top-5 h-8 w-1", accent === "green" && "bg-dgb", accent === "gold" && "bg-fb", accent === "blue" && "bg-sky-600")} />
      <div className="flex items-start justify-between gap-4 pl-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 font-montserrat text-3xl font-semibold tracking-[-0.04em] text-dgb-900">{value}</p>
        </div>
        <span className={cn("grid size-9 place-items-center rounded-md", accent === "green" && "bg-dgb-50 text-dgb", accent === "gold" && "bg-fb-50 text-fb-700", accent === "blue" && "bg-sky-50 text-sky-700")}>
          <AdminIcon name={icon} size={17} strokeWidth={1.8} />
        </span>
      </div>
      <p className="mt-3 pl-4 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

export function AdminEmptyState({ icon = "folder", title, description }: { icon?: AdminIconName; title: string; description?: string }) {
  return (
    <div className="border-y border-dashed border-dgb-200 bg-dgb-50/30 px-5 py-8 text-center">
      <span className="mx-auto grid size-11 place-items-center rounded-md border border-dgb-100 bg-white text-dgb">
        <AdminIcon name={icon} size={19} />
      </span>
      <h3 className="mt-4 font-montserrat text-base font-semibold text-dgb-900">{title}</h3>
      {description ? <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p> : null}
    </div>
  );
}

export function AdminListRow({ title, meta, action, children }: { title: ReactNode; meta?: ReactNode; action?: ReactNode; children?: ReactNode }) {
  return (
    <article className="flex flex-col gap-4 border-b border-dgb-100 px-2 py-4 transition-colors hover:bg-dgb-50/35 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-dgb-900">{title}</h3>
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

