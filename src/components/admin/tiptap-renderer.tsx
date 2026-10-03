import Image from "next/image";
import React from "react";
import { cn } from "@/lib/utils";

export type TipTapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  marks?: Array<{
    type: string;
    attrs?: Record<string, unknown>;
  }>;
  text?: string;
};

export type TipTapRendererProps = {
  content?: TipTapNode | Record<string, unknown> | string | null;
  fallbackText?: string | null;
  className?: string;
};

function renderMarks(textNode: TipTapNode, key: number | string): React.ReactNode {
  let element: React.ReactNode = textNode.text ?? "";

  if (!textNode.marks || textNode.marks.length === 0) {
    return <React.Fragment key={key}>{element}</React.Fragment>;
  }

  for (const mark of textNode.marks) {
    switch (mark.type) {
      case "bold":
        element = <strong className="font-bold text-foreground">{element}</strong>;
        break;
      case "italic":
        element = <em className="italic">{element}</em>;
        break;
      case "strike":
        element = <s className="line-through">{element}</s>;
        break;
      case "code":
        element = (
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground">
            {element}
          </code>
        );
        break;
      case "link": {
        const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "#";
        element = (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-fb underline hover:text-fb-600"
          >
            {element}
          </a>
        );
        break;
      }
      default:
        break;
    }
  }

  return <React.Fragment key={key}>{element}</React.Fragment>;
}

function renderNode(node: TipTapNode, index: number): React.ReactNode {
  if (!node) return null;

  switch (node.type) {
    case "paragraph":
      if (!node.content || node.content.length === 0) {
        return <p key={index} className="mb-4 text-base leading-relaxed text-[#505050] font-inter">&nbsp;</p>;
      }
      return (
        <p key={index} className="mb-4 text-base leading-relaxed text-[#505050] font-inter">
          {node.content.map((child, i) => renderNode(child, i))}
        </p>
      );

    case "heading": {
      const level = node.attrs?.level ?? 2;
      const children = node.content?.map((child, i) => renderNode(child, i));
      if (level === 2) {
        return (
          <h2 key={index} className="mt-8 mb-4 font-montserrat text-2xl md:text-3xl font-bold text-dgb-900">
            {children}
          </h2>
        );
      }
      if (level === 3) {
        return (
          <h3 key={index} className="mt-6 mb-3 font-montserrat text-xl md:text-2xl font-semibold text-dgb-900">
            {children}
          </h3>
        );
      }
      return (
        <h4 key={index} className="mt-4 mb-2 font-montserrat text-lg font-semibold text-dgb-900">
          {children}
        </h4>
      );
    }

    case "bulletList":
      return (
        <ul key={index} className="my-4 ml-6 list-disc space-y-1 text-base text-[#505050] font-inter">
          {node.content?.map((child, i) => renderNode(child, i))}
        </ul>
      );

    case "orderedList":
      return (
        <ol key={index} className="my-4 ml-6 list-decimal space-y-1 text-base text-[#505050] font-inter">
          {node.content?.map((child, i) => renderNode(child, i))}
        </ol>
      );

    case "listItem":
      return (
        <li key={index} className="leading-relaxed">
          {node.content?.map((child, i) => renderNode(child, i))}
        </li>
      );

    case "blockquote":
      return (
        <blockquote
          key={index}
          className="my-6 border-l-4 border-fb bg-fb-50/20 px-4 py-3 italic text-foreground/80 rounded-r-md"
        >
          {node.content?.map((child, i) => renderNode(child, i))}
        </blockquote>
      );

    case "image": {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : null;
      if (!src) return null;
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "Gambar artikel";
      return (
        <figure key={index} className="my-6 space-y-2">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
            <Image
              src={src}
              alt={alt}
              fill
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-cover"
            />
          </div>
          {typeof node.attrs?.alt === "string" && node.attrs.alt.trim().length > 0 ? (
            <figcaption className="text-center text-xs text-muted-foreground">
              {node.attrs.alt}
            </figcaption>
          ) : null}
        </figure>
      );
    }

    case "horizontalRule":
      return <hr key={index} className="my-6 border-border" />;

    case "hardBreak":
      return <br key={index} />;

    case "text":
      return renderMarks(node, index);

    default:
      if (node.content) {
        return (
          <div key={index}>
            {node.content.map((child, i) => renderNode(child, i))}
          </div>
        );
      }
      return null;
  }
}

export function TipTapRenderer({
  content,
  fallbackText,
  className,
}: TipTapRendererProps) {
  let doc: TipTapNode | null = null;

  if (content) {
    if (typeof content === "object" && content !== null && "type" in content) {
      doc = content as TipTapNode;
    } else if (typeof content === "string") {
      try {
        doc = JSON.parse(content) as TipTapNode;
      } catch {
        // Not valid JSON, fallback to string parsing below
        doc = null;
      }
    }
  }

  if (doc && doc.type === "doc" && Array.isArray(doc.content) && doc.content.length > 0) {
    return (
      <div className={cn("space-y-1 font-inter text-foreground", className)}>
        {doc.content.map((node, index) => renderNode(node, index))}
      </div>
    );
  }

  // Fallback to plain text if JSON doc is not available
  const raw = typeof content === "string" ? content : fallbackText;
  if (raw && raw.trim().length > 0) {
    const paragraphs = raw.split("\n\n").filter((p) => p.trim().length > 0);
    return (
      <div className={cn("space-y-4 font-inter text-foreground", className)}>
        {paragraphs.map((p, index) => (
          <p key={index} className="text-base leading-relaxed text-[#505050]">
            {p}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("py-8 text-center text-sm italic text-muted-foreground", className)}>
      Belum ada isi artikel untuk ditampilkan.
    </div>
  );
}
