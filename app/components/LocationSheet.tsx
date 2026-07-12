"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { SelectedPlace } from "../data/trip";

interface Props {
  item: SelectedPlace | null;
  onClose: () => void;
}

function CardBody({ item, onClose }: { item: SelectedPlace; onClose: () => void }) {
  const query = item.query;
  // ?api=1&query= is Google's documented format — resolves to the exact place.
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  // Map fallback (used only when there's no baked photo). Coords pin the exact spot.
  const embedQuery = item.mapCoords ? `${item.mapCoords[0]},${item.mapCoords[1]}` : query;
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(embedQuery)}&z=14&output=embed`;

  return (
    <>
      {/* Media: baked photo, else an embedded map of the exact location */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted flex-shrink-0">
        {item.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.photo} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <iframe
            src={embedUrl}
            title={item.name}
            className="w-full h-full border-0 pointer-events-none"
            loading="lazy"
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/45 to-transparent pointer-events-none" />
        {item.emoji && (
          <div className="absolute bottom-3 left-4 text-4xl drop-shadow-lg">{item.emoji}</div>
        )}
        <button
          onClick={onClose}
          aria-label="✕"
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/35 backdrop-blur-sm flex items-center justify-center text-white/90 hover:bg-black/55 transition-colors text-sm font-bold"
        >
          ✕
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-foreground text-base leading-tight">{item.name}</h3>
        {item.subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{item.subtitle}</p>
        )}
        {item.description && (
          <p className="text-sm text-foreground/70 mt-2 leading-relaxed">{item.description}</p>
        )}

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity bg-primary text-primary-foreground hover:opacity-90"
          data-testid="open-maps-link"
        >
          <span>📍</span> Open in Google Maps
        </a>
      </div>
    </>
  );
}

export default function LocationSheet({ item, onClose }: Props) {
  // Detect mobile client-side to avoid hydration mismatch
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <>
      {/* ── Mobile: bottom sheet rendered in a portal ── */}
      {isMobile && (
        <Sheet open={!!item} onOpenChange={open => !open && onClose()}>
          <SheetContent
            side="bottom"
            className="p-0 rounded-t-2xl overflow-hidden h-auto max-h-[80dvh]"
            showCloseButton={false}
          >
            {item && <CardBody item={item} onClose={onClose} />}
          </SheetContent>
        </Sheet>
      )}

      {/* ── Desktop: floating card fixed bottom-right ── */}
      {!isMobile && (
        <AnimatePresence>
          {item && (
            <motion.div
              key="location-card"
              initial={{ y: 20, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="fixed bottom-6 right-6 z-[100] w-80 overflow-hidden rounded-2xl shadow-2xl bg-card border border-border flex flex-col"
            >
              <CardBody item={item} onClose={onClose} />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );
}
