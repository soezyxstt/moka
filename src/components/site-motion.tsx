"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type SiteMotionProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Global smooth reveal motion system inspired by tampiloka.adihnursyam.com.
 * Uses progressive enhancement, IntersectionObserver, and staggered deceleration
 * to gracefully animate text and components as they enter the viewport.
 */
export function SiteMotion({ children, className }: SiteMotionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
      "main article",
      "main figure",
      "main li",
      "footer h2",
      "footer h3",
      "footer p",
      "footer a",
    ].join(", ");

    const seenSet = new WeakSet<HTMLElement>();
    const parentCountMap = new Map<HTMLElement, number>();

    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              for (const entry of entries) {
                if (entry.isIntersecting) {
                  const target = entry.target as HTMLElement;
                  target.dataset.revealed = "true";
                  observer?.unobserve(target);
                }
              }
            },
            { threshold: 0.12, rootMargin: "0px" }
          )
        : null;

    const registerElement = (el: HTMLElement) => {
      if (seenSet.has(el)) return;
      if (el.dataset.revealed === "true") {
        seenSet.add(el);
        return;
      }

      // Avoid animating hidden elements or items inside overlay modals/menus
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

      // If an ancestor is already a registered reveal container, preserve cohesive animation
      if (el.parentElement?.closest("[data-reveal]")) {
        return;
      }

      seenSet.add(el);
      el.dataset.reveal = "";

      const parent = el.parentElement;
      if (parent) {
        const count = parentCountMap.get(parent) ?? 0;
        el.style.setProperty("--reveal-delay", `${(count % 6) * 80}ms`);
        parentCountMap.set(parent, count + 1);
      }

      if (observer) {
        observer.observe(el);
      } else {
        el.dataset.revealed = "true";
      }
    };

    const handleAddedNode = (node: Node) => {
      if (node instanceof HTMLElement) {
        if (node.matches(selector)) registerElement(node);
        node.querySelectorAll(selector).forEach((child) => {
          if (child instanceof HTMLElement) registerElement(child);
        });
      }
    };

    const initialElements = Array.from(root.querySelectorAll(selector)).filter(
      (el): el is HTMLElement => el instanceof HTMLElement
    );

    if (!("MutationObserver" in window)) {
      initialElements.forEach((el) => {
        el.dataset.revealed = "true";
      });
      return;
    }

    initialElements.forEach(registerElement);
    root.dataset.motionReady = "true";

    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes") {
          if (mutation.target instanceof HTMLElement) {
            registerElement(mutation.target);
          }
        } else {
          mutation.addedNodes.forEach(handleAddedNode);
        }
      }
    });

    mutationObserver.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-reveal"],
    });

    return () => {
      observer?.disconnect();
      mutationObserver.disconnect();
    };
  }, [pathname]);

  return (
    <div className={cn("site-motion", className)} ref={ref}>
      {children}
    </div>
  );
}
