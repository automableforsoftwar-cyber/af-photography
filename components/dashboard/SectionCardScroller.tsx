"use client";

import { motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import type { HubSection } from "@/lib/hub-curriculum";

const ease = [0.22, 1, 0.36, 1] as const;
const DRAG_THRESHOLD = 8;

type SectionCardScrollerProps = {
  sections: HubSection[];
  selectedId: string;
  completed: Set<string>;
  compact?: boolean;
  onSelectSection: (section: HubSection) => void;
};

function snappedSectionId(container: HTMLElement) {
  const styles = getComputedStyle(container);
  const rtl = styles.direction === "rtl";
  const startPad = Number.parseFloat(styles.paddingInlineStart) || 0;
  const box = container.getBoundingClientRect();
  const snapLine = rtl ? box.right - startPad : box.left + startPad;
  let bestId: string | null = null;
  let bestDist = Number.POSITIVE_INFINITY;

  for (const card of container.querySelectorAll<HTMLElement>("[data-section-id]")) {
    const cardBox = card.getBoundingClientRect();
    const edge = rtl ? cardBox.right : cardBox.left;
    const dist = Math.abs(edge - snapLine);
    if (dist < bestDist) {
      bestDist = dist;
      bestId = card.dataset.sectionId ?? null;
    }
  }

  return bestId;
}

export function SectionCardScroller({
  sections,
  selectedId,
  completed,
  compact = false,
  onSelectSection,
}: SectionCardScrollerProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const skipSnapSync = useRef(false);
  const suppressClick = useRef(false);
  const pointer = useRef<{
    id: number;
    lastX: number;
    originX: number;
    dragged: boolean;
  } | null>(null);
  const [grabbing, setGrabbing] = useState(false);
  const skipTimeout = useRef<number | null>(null);

  const syncFromSnap = useCallback(() => {
    const node = scrollerRef.current;
    if (!node || skipSnapSync.current) {
      return;
    }
    const id = snappedSectionId(node);
    if (!id || id === selectedId) {
      return;
    }
    const section = sections.find((item) => item.id === id);
    if (section) {
      onSelectSection(section);
    }
  }, [onSelectSection, sections, selectedId]);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) {
      return;
    }
    const card = node.querySelector<HTMLElement>(
      `[data-section-id="${selectedId}"]`,
    );
    if (!card) {
      return;
    }

    skipSnapSync.current = true;
    card.scrollIntoView({
      inline: "start",
      block: "nearest",
      behavior: "smooth",
    });

    if (skipTimeout.current !== null) {
      window.clearTimeout(skipTimeout.current);
    }
    skipTimeout.current = window.setTimeout(() => {
      skipSnapSync.current = false;
      skipTimeout.current = null;
    }, 520);

    return () => {
      if (skipTimeout.current !== null) {
        window.clearTimeout(skipTimeout.current);
      }
    };
  }, [selectedId]);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) {
      return;
    }

    let settle: number | null = null;
    const onScroll = () => {
      if (pointer.current?.dragged) {
        return;
      }
      if (settle !== null) {
        window.clearTimeout(settle);
      }
      settle = window.setTimeout(() => {
        settle = null;
        syncFromSnap();
      }, 140);
    };

    const onWheel = (event: WheelEvent) => {
      if (!event.shiftKey || event.deltaY === 0) {
        return;
      }
      event.preventDefault();
      node.scrollLeft += event.deltaY;
    };

    node.addEventListener("scroll", onScroll, { passive: true });
    node.addEventListener("scrollend", syncFromSnap);
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      if (settle !== null) {
        window.clearTimeout(settle);
      }
      node.removeEventListener("scroll", onScroll);
      node.removeEventListener("scrollend", syncFromSnap);
      node.removeEventListener("wheel", onWheel);
    };
  }, [syncFromSnap]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) {
      return;
    }
    suppressClick.current = false;
    pointer.current = {
      id: event.pointerId,
      lastX: event.clientX,
      originX: event.clientX,
      dragged: false,
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = pointer.current;
    const node = scrollerRef.current;
    if (!state || !node || event.pointerId !== state.id) {
      return;
    }
    if (!state.dragged) {
      if (Math.abs(event.clientX - state.originX) < DRAG_THRESHOLD) {
        return;
      }
      state.dragged = true;
      suppressClick.current = true;
      node.setPointerCapture(event.pointerId);
      node.style.scrollSnapType = "none";
      node.style.scrollBehavior = "auto";
      setGrabbing(true);
    }
    const dx = event.clientX - state.lastX;
    state.lastX = event.clientX;
    const rtl = getComputedStyle(node).direction === "rtl";
    node.scrollLeft += rtl ? dx : -dx;
  };

  const endPointer = (event: PointerEvent<HTMLDivElement>) => {
    const state = pointer.current;
    const node = scrollerRef.current;
    if (!state || event.pointerId !== state.id) {
      return;
    }
    const wasDragging = state.dragged;
    pointer.current = null;
    if (node) {
      if (node.hasPointerCapture(event.pointerId)) {
        node.releasePointerCapture(event.pointerId);
      }
      node.style.scrollSnapType = "";
      node.style.scrollBehavior = "";
    }
    setGrabbing(false);
    if (wasDragging) {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(syncFromSnap);
      });
    }
  };

  return (
    <div
      ref={scrollerRef}
      role="tablist"
      aria-label="أقسام الدورة"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      className={`hide-scrollbar flex snap-x snap-mandatory flex-nowrap gap-3 overflow-x-auto overscroll-x-contain scroll-auto scroll-ps-1 px-1 pb-1 touch-pan-x ${
        grabbing ? "cursor-grabbing select-none" : "cursor-grab"
      }`}
    >
      {sections.map((section) => {
        const selected = section.id === selectedId;
        const doneCount = section.lessons.filter((lesson) =>
          completed.has(lesson.id),
        ).length;
        const allDone = doneCount === section.lessons.length;

        return (
          <motion.button
            key={section.id}
            type="button"
            role="tab"
            layout
            data-section-id={section.id}
            aria-selected={selected}
            aria-label={section.label}
            onClick={() => {
              if (suppressClick.current) {
                suppressClick.current = false;
                return;
              }
              onSelectSection(section);
            }}
            whileHover={grabbing ? undefined : { y: compact ? 0 : -3 }}
            whileTap={grabbing ? undefined : { scale: 0.98 }}
            transition={{ layout: { duration: 0.4, ease } }}
            className={`relative shrink-0 snap-start overflow-hidden border text-start shadow-[0_16px_40px_rgba(0,0,0,0.28)] backdrop-blur-2xl ${
              compact
                ? "flex size-12 items-center justify-center rounded-xl"
                : "min-w-[11.5rem] rounded-2xl px-4 py-4"
            } ${
              selected
                ? "border-gold/45 bg-gold/12 shadow-[0_0_32px_rgba(196,165,116,0.2)]"
                : allDone
                  ? "border-emerald-400/30 bg-emerald-400/8"
                  : "border-white/10 bg-white/5"
            }`}
          >
            {selected ? (
              <motion.span
                layoutId="hub-folder-glow"
                className={`pointer-events-none absolute inset-0 ring-1 ring-gold/40 ${
                  compact ? "rounded-xl" : "rounded-2xl"
                }`}
                transition={{ duration: 0.35, ease }}
              />
            ) : null}
            {compact ? (
              <span
                className={`relative z-10 text-base font-bold ${
                  allDone ? "text-emerald-300" : "text-gold-soft"
                }`}
              >
                {section.abbrev}
              </span>
            ) : (
              <>
                <span
                  className={`text-xs font-medium ${
                    allDone ? "text-emerald-300" : "text-gold"
                  }`}
                >
                  القسم {section.number}
                </span>
                <span className="mt-2 block text-lg font-bold leading-relaxed text-slate-50">
                  {section.shortTitle}
                </span>
                {section.audience ? (
                  <span className="mt-1 block text-xs font-medium leading-relaxed text-slate-500">
                    {section.audience}
                  </span>
                ) : null}
                <span className="mt-3 block text-xs font-medium text-slate-400">
                  {doneCount}/{section.lessons.length} مكتمل
                </span>
              </>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
