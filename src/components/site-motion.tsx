"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type SiteMotionProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Global smooth reveal motion system using IntersectionObserver and the native
 * Web Animations API so DOM attributes are never mutated during React hydration.
 */
export function SiteMotion({ children, className }: SiteMotionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window) ||
      typeof Element.prototype.animate !== "function"
    ) {
      return;
    }

    const selector = [
      "[data-reveal]",
      "main h1",
      "main h2",
      "main h3",
      "main h4",
      "main h5",
      "main h6",
      "main p",
      "main figure",
      "main li",
      "footer h2",
      "footer h3",
      "footer p",
      "footer a",
    ].join(", ");

    const seenSet = new WeakSet<HTMLElement>();
    const parentCountMap = new Map<HTMLElement, number>();
    const delayMap = new WeakMap<HTMLElement, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            observer.unobserve(target);
            const delay = delayMap.get(target) ?? 0;
            target.animate(
              [
                { opacity: 0, transform: "translateY(24px)" },
                { opacity: 1, transform: "translateY(0)" },
              ],
              {
                duration: 650,
                delay,
                easing: "cubic-bezier(0.19, 1, 0.22, 1)",
                fill: "backwards",
              }
            );
          }
        }
      },
      { threshold: 0.05, rootMargin: "0px" }
    );

    const registerElement = (el: HTMLElement) => {
      if (seenSet.has(el)) return;

      if (
        !el.hasAttribute("data-reveal") &&
        (el.closest('[aria-hidden="true"]') ||
          el.closest("[data-no-reveal]") ||
          el.closest('[role="dialog"]') ||
          el.closest('[role="menu"]') ||
          el.closest('[role="listbox"]') ||
          el.closest("[data-radix-popper-content-wrapper]"))
      ) {
        return;
      }

      if (el.parentElement?.closest("[data-reveal]")) {
        return;
      }

      seenSet.add(el);

      const parent = el.parentElement;
      if (parent) {
        const count = parentCountMap.get(parent) ?? 0;
        delayMap.set(el, (count % 6) * 70);
        parentCountMap.set(parent, count + 1);
      }

      observer.observe(el);
    };

    const handleAddedNode = (node: Node) => {
      if (node instanceof HTMLElement) {
        if (node.matches(selector)) registerElement(node);
        node.querySelectorAll(selector).forEach((child) => {
          if (child instanceof HTMLElement) registerElement(child);
        });
      }
    };

    root.querySelectorAll(selector).forEach((el) => {
      if (el instanceof HTMLElement) registerElement(el);
    });

    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(handleAddedNode);
      }
    });

    mutationObserver.observe(root, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [pathname]);

  return (
    <div className={cn("site-motion", className)} ref={ref}>
      {children}
    </div>
  );
}
