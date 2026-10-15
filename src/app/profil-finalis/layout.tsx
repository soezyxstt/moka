import type { ReactNode } from "react";
import { getPublicEventSharingMetadata } from "@/server/cms/public-readers";

export const generateMetadata = getPublicEventSharingMetadata;
export default function FinalistLayout({ children }: { children: ReactNode }) { return children; }
