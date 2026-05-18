"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Stay, Activity, Leg, TransportMode } from "../data/trip";
import { stays, legs, activities, modeColors, modeIcons } from "../data/trip";

interface PopupInfo {
  type: "stay" | "activity" | "leg";
  item: Stay | Activity | Leg;
  x: number;
  y: number;
}

interface MapPin {
  id: string;
  lat: number;
  lng: number;
  emoji: string;
  label: string;
  type: "stay" | "activity" | "waypoint";
  item: Stay | Activity;
  placeQuery?: string;
}

// Mercator projection helpers
function toMercator(lat: number, lng: number, bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }, width: number, height: number) {
  const padding = 60;
  const w = width - padding * 2;
  const h = height - padding * 2;
  const x = padding + ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * w;
  // Use Mercator lat projection
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const minLatRad = (bounds.minLat * Math.PI) / 180;
  const maxLatRad = (bounds.maxLat * Math.PI) / 180;
  const mercMin = Math.log(Math.tan(Math.PI / 4 + minLatRad / 2));
  const mercMax = Math.log(Math.tan(Math.PI / 4 + maxLatRad / 2));
  const y = padding + h - ((mercN - mercMin) / (mercMax - mercMin)) * h;
  return { x, y };
}

const ALL_COORDS = [
  [40.6413, -73.7781], // JFK
  [45.6306, 8.7281],   // MXP
  [45.8832, 8.5355],   // Stresa
  [45.4851, 9.2035],   // Milan
  [43.7760, 11.2457],  // Florence
  [43.0667, 11.7167],  // Lupaia
  [41.7999, 12.2462],  // FCO
  [41.1387, 16.7624],  // BRI
  [40.7285, 17.5888],  // Ostuni
  [39.2548, 9.0540],   // CAG
  [49.0097, 2.5479],   // CDG
];

const BOUNDS = {
  minLat: Math.min(...ALL_COORDS.map(c => c[0])) - 2,
  maxLat: Math.max(...ALL_COORDS.map(c => c[0])) + 4,
  minLng: Math.min(...ALL_COORDS.map(c => c[1])) - 8,
  maxLng: Math.max(...ALL_COORDS.map(c => c[1])) + 4,
};

// Route waypoints in order
const ROUTE_POINTS: [number, number][] = [
  [40.6413, -73.7781], // JFK
  [45.6306, 8.7281],   // MXP
  [45.8832, 8.5355],   // Stresa
  [45.4851, 9.2035],   // Milan
  [43.7760, 11.2457],  // Florence
  [43.0667, 11.7167],  // Lupaia
  [41.7999, 12.2462],  // FCO
  [41.1387, 16.7624],  // BRI
  [40.7285, 17.5888],  // Ostuni
  [39.2548, 9.0540],   // CAG
  [49.0097, 2.5479],   // CDG
  [40.6413, -73.7781], // JFK (home)
];

const LEG_MODES: TransportMode[] = [
  "flight", "train", "train", "train", "car", "car", "flight", "car", "flight", "car", "flight", "flight"
];

export default function TripMap() {
  const [size, setSize] = useState({ w: 1200, h: 700 });
  const [popup, setPopup] = useState<PopupInfo | null>(null);
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const [animProgress, setAnimProgress] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setSize({ w: width, h: height });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Animate route drawing
  useEffect(() => {
    let frame: number;
    let start: number | null = null;
    const duration = 3000;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setAnimProgress(p);
      if (p < 1) frame = requestAnimationFrame(animate);
    };
    const delay = setTimeout(() => { frame = requestAnimationFrame(animate); }, 500);
    return () => { clearTimeout(delay); cancelAnimationFrame(frame); };
  }, []);

  const project = (lat: number, lng: number) =>
    toMercator(lat, lng, BOUNDS, size.w, size.h);

  // Build SVG path for route
  const routePoints = ROUTE_POINTS.map(([lat, lng]) => project(lat, lng));

  // Build path segments between consecutive points
  const segments = routePoints.slice(0, -1).map((start, i) => {
    const end = routePoints[i + 1];
    const mode = LEG_MODES[i];
    // Curve control point — transatlantic arcs bow north dramatically
    const isFlight = mode === "flight";
    const isLongHaul = isFlight && Math.abs(end.x - start.x) > size.w * 0.3;
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const perpX = -dy / len;
    const perpY = dx / len;
    const bowAmount = isLongHaul ? -len * 0.35 : isFlight ? -len * 0.15 : 0;
    const cx = midX + perpX * bowAmount;
    const cy = midY + perpY * bowAmount;
    return { start, end, cx, cy, mode };
  });

  // Total path length approximation for animation
  const totalSegments = segments.length;
  const drawnSegments = Math.floor(animProgress * totalSegments);
  const partialFraction = (animProgress * totalSegments) % 1;

  // Build pins
  const pins: MapPin[] = [
    ...stays.map(s => ({
      id: s.id,
      lat: s.location.coords[0],
      lng: s.location.coords[1],
      emoji: s.emoji,
      label: s.name,
      type: "stay" as const,
      item: s,
      placeQuery: s.location.placeQuery,
    })),
    ...activities.map(a => ({
      id: a.id,
      lat: a.location.coords[0],
      lng: a.location.coords[1],
      emoji: a.emoji,
      label: a.name,
      type: "activity" as const,
      item: a,
      placeQuery: a.location.placeQuery,
    })),
  ];

  const handlePinClick = (pin: MapPin, e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPopup({
      type: pin.type === "stay" ? "stay" : "activity",
      item: pin.item,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden" onClick={() => setPopup(null)}>
      {/* Background gradient map */}
      <svg
        ref={svgRef}
        width={size.w}
        height={size.h}
        className="absolute inset-0"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0c1a2e 100%)" }}
      >
        <defs>
          {/* Glow filter for active routes */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="pinGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* Animate dash for pending legs */}
          <style>{`
            @keyframes dash { to { stroke-dashoffset: -20; } }
            .pending-leg { animation: dash 0.8s linear infinite; }
          `}</style>
        </defs>

        {/* Subtle grid */}
        {Array.from({ length: 20 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={(i / 20) * size.h} x2={size.w} y2={(i / 20) * size.h}
            stroke="rgba(255,255,255,0.03)" strokeWidth={1} />
        ))}
        {Array.from({ length: 30 }).map((_, i) => (
          <line key={`v${i}`} x1={(i / 30) * size.w} y1={0} x2={(i / 30) * size.w} y2={size.h}
            stroke="rgba(255,255,255,0.03)" strokeWidth={1} />
        ))}

        {/* Drawn route segments */}
        {segments.map((seg, i) => {
          if (i > drawnSegments) return null;
          const color = modeColors[seg.mode];
          const isPartial = i === drawnSegments;
          const isBooked = legs[i]?.status === "booked";

          if (isPartial) {
            // Interpolate end point
            const ex = seg.start.x + (seg.end.x - seg.start.x) * partialFraction;
            const ey = seg.start.y + (seg.end.y - seg.start.y) * partialFraction;
            return (
              <line key={i} x1={seg.start.x} y1={seg.start.y} x2={ex} y2={ey}
                stroke={color} strokeWidth={2} strokeOpacity={0.8}
                filter="url(#glow)" />
            );
          }

          return (
            <g key={i}>
              <path
                d={`M ${seg.start.x} ${seg.start.y} Q ${seg.cx} ${seg.cy} ${seg.end.x} ${seg.end.y}`}
                fill="none"
                stroke={color}
                strokeWidth={isBooked ? 3 : 2}
                strokeOpacity={isBooked ? 1 : 0.6}
                strokeDasharray={isBooked ? "none" : "6 4"}
                className={isBooked ? "" : "pending-leg"}
                filter="url(#glow)"
              />
              {/* Direction arrow */}
              {i < totalSegments - 1 && (
                <circle
                  cx={(seg.start.x + seg.end.x) / 2}
                  cy={(seg.start.y + seg.end.y) / 2}
                  r={3}
                  fill={color}
                  fillOpacity={0.8}
                />
              )}
            </g>
          );
        })}

        {/* Animated travel dot */}
        {animProgress < 1 && animProgress > 0 && (() => {
          const seg = segments[Math.min(drawnSegments, segments.length - 1)];
          if (!seg) return null;
          const t = partialFraction;
          const px = seg.start.x + (seg.end.x - seg.start.x) * t;
          const py = seg.start.y + (seg.end.y - seg.start.y) * t;
          return (
            <g>
              <circle cx={px} cy={py} r={8} fill="white" fillOpacity={0.2} />
              <circle cx={px} cy={py} r={4} fill="white" fillOpacity={0.9} filter="url(#glow)" />
            </g>
          );
        })()}

        {/* Waypoint dots for airports/stations */}
        {ROUTE_POINTS.slice(0, drawnSegments + 1).map(([lat, lng], i) => {
          const { x, y } = project(lat, lng);
          const isFirst = i === 0;
          const isLast = i === ROUTE_POINTS.length - 1;
          if (isFirst || isLast) return null;
          return (
            <circle key={i} cx={x} cy={y} r={3} fill="rgba(255,255,255,0.5)"
              stroke="white" strokeWidth={1} strokeOpacity={0.3} />
          );
        })}
      </svg>

      {/* Map pins (overlaid as HTML for emoji + interaction) */}
      {pins.map(pin => {
        const { x, y } = project(pin.lat, pin.lng);
        const isHovered = hoveredPin === pin.id;
        return (
          <motion.div
            key={pin.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer select-none"
            style={{ left: x, top: y, zIndex: isHovered ? 20 : 10 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: animProgress > 0.3 ? 0.1 : 1.5, type: "spring", stiffness: 300 }}
            onMouseEnter={() => setHoveredPin(pin.id)}
            onMouseLeave={() => setHoveredPin(null)}
            onClick={e => { e.stopPropagation(); handlePinClick(pin, e); }}
          >
            <motion.div
              animate={{ scale: isHovered ? 1.3 : 1 }}
              className="flex flex-col items-center"
            >
              <div
                className={`text-2xl drop-shadow-lg ${pin.type === "stay" ? "text-3xl" : "text-xl"}`}
                style={{ filter: isHovered ? "drop-shadow(0 0 8px rgba(255,255,255,0.8))" : "drop-shadow(0 2px 4px rgba(0,0,0,0.8))" }}
              >
                {pin.emoji}
              </div>
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="mt-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                    style={{ background: "rgba(15,23,42,0.9)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }}
                  >
                    {pin.label}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        );
      })}

      {/* Popup card */}
      <AnimatePresence>
        {popup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute z-50 w-72"
            style={{
              left: Math.min(popup.x + 12, size.w - 300),
              top: Math.min(popup.y - 20, size.h - 220),
            }}
            onClick={e => e.stopPropagation()}
          >
            <PopupCard popup={popup} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 z-10">
        {(["flight", "train", "car"] as TransportMode[]).map(mode => (
          <div key={mode} className="flex items-center gap-2">
            <div className="w-6 h-0.5 rounded-full" style={{ background: modeColors[mode] }} />
            <span className="text-xs text-white/60 capitalize">{modeIcons[mode]} {mode}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 mt-1">
          <div className="w-6 h-0.5 rounded-full border-t border-dashed border-white/40" />
          <span className="text-xs text-white/40">pending</span>
        </div>
      </div>
    </div>
  );
}

function PopupCard({ popup }: { popup: PopupInfo }) {
  const isStay = popup.type === "stay";
  const item = popup.item as Stay | Activity;
  const stay = isStay ? (item as Stay) : null;
  const activity = !isStay ? (item as Activity) : null;
  const placeQuery = isStay
    ? (stay!.location.placeQuery || stay!.name)
    : (activity!.location.placeQuery || activity!.name);
  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(placeQuery)}`;

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-2xl"
      style={{
        background: "rgba(15,23,42,0.95)",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* OpenStreetMap embed preview (no API key needed) */}
      <div className="relative h-32 overflow-hidden">
        <iframe
          src={`https://maps.google.com/maps?q=${encodeURIComponent(placeQuery)}&output=embed&t=m&z=13`}
          className="w-full h-full border-0 pointer-events-none"
          title="map preview"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/80 pointer-events-none" />
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <p className="text-white font-semibold text-sm leading-tight">
              {isStay ? stay!.name : activity!.name}
            </p>
            <p className="text-white/50 text-xs mt-0.5">
              {isStay ? `${stay!.checkIn} – ${stay!.checkOut} · ${stay!.nights} nights` : activity!.date}
            </p>
          </div>
          <span className="text-xl">{isStay ? stay!.emoji : activity!.emoji}</span>
        </div>
        <p className="text-white/60 text-xs leading-relaxed">
          {isStay ? stay!.description : activity!.notes}
        </p>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <span>📍</span> Open in Google Maps
        </a>
      </div>
    </div>
  );
}
