"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  query: string;       // Google Maps search query
  name: string;        // Display name in card header
  subtitle?: string;   // Optional subtitle (city, dates, etc.)
  children: React.ReactNode;
}

// Hover popovers are a desktop affordance. On touch/mobile they misfire on tap and
// there's no room for a side card — so we skip them and let the tap open the
// LocationSheet bottom drawer instead.
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}

export default function PlaceHoverCard({ query, name, subtitle, children }: Props) {
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);
  const [cardTop, setCardTop] = useState(0);
  const triggerRef = useRef<HTMLDivElement>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed&z=15`;

  const handleMouseEnter = useCallback(() => {
    clearTimeout(hideTimer.current);
    showTimer.current = setTimeout(() => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) {
        // Clamp so card doesn't go below viewport
        const cardHeight = 260;
        const top = Math.min(rect.top, window.innerHeight - cardHeight - 16);
        setCardTop(top);
      }
      setVisible(true);
    }, 280);
  }, []);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(showTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), 160);
  }, []);

  // Left edge of card = sidebar width (320px) + 8px gap
  const CARD_LEFT = 328;

  // On mobile, render the trigger only — taps bubble to the LocationSheet drawer.
  if (isMobile) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="cursor-pointer"
      >
        {children}
      </div>

      <AnimatePresence>
        {visible && (
          <motion.div
            key="place-card"
            initial={{ opacity: 0, x: -8, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -8, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed z-[9999] w-72 overflow-hidden rounded-2xl shadow-2xl border border-border bg-card"
            style={{ top: cardTop, left: CARD_LEFT }}
            onMouseEnter={() => clearTimeout(hideTimer.current)}
            onMouseLeave={handleMouseLeave}
          >
            {/* Map embed */}
            <div className="relative h-40 overflow-hidden bg-muted">
              <iframe
                src={embedUrl}
                title={name}
                className="w-full h-full border-0 pointer-events-none"
                loading="lazy"
              />
              {/* Gradient so card info reads over map edge */}
              <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card to-transparent pointer-events-none" />
            </div>

            {/* Info */}
            <div className="px-4 pb-4 pt-3">
              <p className="font-semibold text-sm text-foreground leading-snug">{name}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
              )}

              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                data-testid="hover-card-maps-link"
              >
                <span>View on Google Maps →</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
