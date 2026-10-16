"use client";

import type { ComponentProps } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import styles from "./admin-scroll-area.module.css";

export const adminNativeScrollbarClassName = styles.native;

export type AdminScrollAreaProps = ComponentProps<typeof ScrollArea> & {
  surface?: "dark" | "light";
};

export function AdminScrollArea({
  className,
  surface = "light",
  type = "auto",
  ...props
}: AdminScrollAreaProps) {
  return (
    <ScrollArea
      data-surface={surface}
      type={type}
      className={cn(styles.root, className)}
      data-lenis-prevent
      {...props}
    />
  );
}
