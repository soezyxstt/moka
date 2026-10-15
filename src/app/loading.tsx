import { LoaderCircle } from "lucide-react";
import { SiteStatus } from "@/components/custom/site-status";

export default function Loading() {
  return (
    <SiteStatus
      loading
      visual={<LoaderCircle strokeWidth={0.75} className="size-32 text-brand motion-safe:animate-spin md:size-48" />}
      title="Memuat halaman"
      description=""
    />
  );
}
