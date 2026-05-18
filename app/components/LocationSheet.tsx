"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Stay, Activity } from "../data/trip";

interface Props {
  item: Stay | Activity | null;
  onClose: () => void;
}

function isStay(item: Stay | Activity): item is Stay {
  return "checkIn" in item;
}

export default function LocationSheet({ item, onClose }: Props) {
  if (!item) return null;

  const stay = isStay(item) ? item : null;
  const activity = !isStay(item) ? (item as Activity) : null;
  const query = stay ? stay.location.placeQuery : activity!.location.placeQuery;
  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(query ?? item.name)}`;
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query ?? item.name)}&output=embed&z=14`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 pointer-events-none"
      >
        {/* Backdrop — dismiss on click */}
        <div
          className="absolute inset-0 pointer-events-auto"
          onClick={onClose}
        />

        {/* Card — fixed bottom-right */}
        <motion.div
          initial={{ y: 24, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 24, opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="fixed bottom-6 right-6 w-80 pointer-events-auto overflow-hidden rounded-2xl shadow-2xl bg-card border border-border"
        >
          {/* Map preview */}
          <div className="relative h-40 overflow-hidden bg-muted">
            <iframe
              src={embedUrl}
              className="w-full h-full border-0"
              title="Location preview"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent pointer-events-none" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground border border-border/50 transition-colors text-sm"
            >
              ✕
            </button>

            {/* Emoji overlay */}
            <div className="absolute bottom-3 left-4 text-3xl filter drop-shadow-lg">
              {item.emoji}
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
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

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-semibold transition-colors border border-border hover:bg-muted/70 text-foreground"
            >
              <span>📍</span> Open in Google Maps
            </a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
