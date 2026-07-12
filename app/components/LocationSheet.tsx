"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { Stay, Activity } from "../data/trip";

interface Props {
  item: Stay | Activity | null;
  onClose: () => void;
}

function isStay(item: Stay | Activity): item is Stay {
  return "checkIn" in item;
}

function CardBody({ item, onClose }: { item: Stay | Activity; onClose: () => void }) {
  const stay = isStay(item) ? item : null;
  const activity = !isStay(item) ? (item as Activity) : null;
  const query = stay ? stay.location.placeQuery : activity!.location.placeQuery;
  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(query ?? item.name)}`;
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query ?? item.name)}&output=embed&z=14`;

  return (
    <>
      <div className="relative h-44 overflow-hidden bg-muted flex-shrink-0">
        <iframe src={embedUrl} title={item.name}
          className="w-full h-full border-0 pointer-events-none" loading="lazy" />
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent pointer-events-none" />
        <div className="absolute bottom-3 left-4 text-4xl filter drop-shadow-lg">{item.emoji}</div>
        <button
          onClick={onClose}
          aria-label="✕"
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground border border-border/60 transition-colors text-xs font-bold"
        >
          ✕
        </button>
      </div>

      <div className="p-4 overflow-y-auto">
        <h3 className="font-semibold text-foreground text-base leading-tight">
          {stay ? stay.name : activity!.name}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {stay
            ? `${stay.location.name} · ${stay.checkIn} – ${stay.checkOut} · ${stay.nights} nights`
            : `${activity!.date ?? ""} · ${activity!.category}`}
        </p>
        <p className="text-xs text-foreground/70 mt-2 leading-relaxed">
          {stay ? stay.description : activity!.notes}
        </p>
        {/* Distinct label from PlaceHoverCard's "See reviews & photos" */}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold transition-colors bg-primary text-primary-foreground hover:opacity-90"
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
