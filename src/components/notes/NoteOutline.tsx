"use client";

import { useEffect, useState, type RefObject } from "react";
import { cn } from "@/lib/cn";

interface OutlineItem {
  id: string;
  text: string;
  level: number;
}

function slugify(text: string, usedIds: Set<string>): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60) || "section";
  let slug = base;
  let i = 2;
  while (usedIds.has(slug)) {
    slug = `${base}-${i}`;
    i += 1;
  }
  usedIds.add(slug);
  return slug;
}

/**
 * Live heading outline for the note editor — scans the rendered ProseMirror DOM
 * (not the raw HTML string) so it always reflects what's on screen, assigns
 * stable ids to headings that lack one, and scroll-spies via IntersectionObserver.
 */
export function NoteOutline({
  containerRef,
  content,
}: {
  containerRef: RefObject<HTMLElement | null>;
  content: string;
}) {
  const [items, setItems] = useState<OutlineItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const raf = requestAnimationFrame(() => {
      const headings = Array.from(container.querySelectorAll("h2, h3")) as HTMLElement[];
      const usedIds = new Set<string>();
      headings.forEach((h) => {
        if (h.id) usedIds.add(h.id);
      });
      const nextItems: OutlineItem[] = headings.map((h) => {
        if (!h.id) h.id = slugify(h.textContent ?? "", usedIds);
        return { id: h.id, text: h.textContent ?? "", level: h.tagName === "H2" ? 2 : 3 };
      });
      setItems(nextItems);
    });

    return () => cancelAnimationFrame(raf);
  }, [content, containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || items.length === 0) return;

    const headingEls = items
      .map((item) => container.querySelector<HTMLElement>(`#${CSS.escape(item.id)}`))
      .filter((el): el is HTMLElement => !!el);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const topMost = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
          setActiveId(topMost.target.id);
        }
      },
      { rootMargin: "-10% 0px -70% 0px", threshold: [0, 1] }
    );
    headingEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items, containerRef]);

  function handleClick(id: string) {
    const target = containerRef.current?.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
  }

  if (items.length === 0) return null;

  return (
    <nav className="flex flex-col gap-0.5">
      <p className="text-label text-graphite mb-1.5">Outline</p>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => handleClick(item.id)}
          className={cn(
            "text-left text-caption truncate transition-fast rounded-md px-2 py-1",
            item.level === 3 && "pl-4",
            activeId === item.id ? "text-tuscan font-semibold bg-tuscan/10" : "text-graphite hover:text-text"
          )}
        >
          {item.text || "Untitled section"}
        </button>
      ))}
    </nav>
  );
}
