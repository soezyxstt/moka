import type { ReactNode } from "react";
import { getPublicEventSharingMetadata } from "@/server/cms/public-readers";

export const generateMetadata = getPublicEventSharingMetadata;
export default function SemifinalistLayout({ children }: { children: ReactNode }) { return children; }
