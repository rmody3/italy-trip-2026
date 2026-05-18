"use client";

import { useEffect, useRef } from "react";
import type { Map as LMap, Polyline } from "leaflet";
import { stays, activities, legs } from "../data/trip";
import type { Stay, Activity } from "../data/trip";

interface Props {
  onLocationSelect: (item: Stay | Activity | null) => void;
  activeTheme: string;
}

const TILES: Record<string, { url: string; attribution: string }> = {
  amalfi: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: "© <a href='https://www.openstreetmap.org/copyright'>OSM</a> © <a href='https://carto.com/'>CartoDB</a>",
  },
  capri: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: "© <a href='https://www.openstreetmap.org/copyright'>OSM</a> © <a href='https://carto.com/'>CartoDB</a>",
  },
  notte: {
    url: "https://{s}.basemaps.cartocdn.com/dark_matter/{z}/{x}/{y}{r}.png",
    attribution: "© <a href='https://www.openstreetmap.org/copyright'>OSM</a> © <a href='https://carto.com/'>CartoDB</a>",
  },
};

// Great-circle waypoints for the transatlantic routes
const TRANSATLANTIC: [number, number][] = [
  [40.64, -73.78], [43.0, -60.0], [47.0, -40.0],
  [50.0, -20.0], [50.5, -5.0], [47.5, 5.0], [45.63, 8.73],
];
const RETURN_ARC: [number, number][] = [
  [39.25, 9.05], [42.0, 5.0], [46.0, 3.0], [49.01, 2.55],
  [53.0, -5.0], [52.0, -20.0], [47.0, -40.0], [43.5, -60.0], [40.64, -73.78],
];

const ROUTE_SEGMENTS = [
  { points: TRANSATLANTIC,                                              mode: "flight", status: legs[0].status },
  { points: [[45.63, 8.73], [45.88, 8.54]] as [number,number][],       mode: "train",  status: legs[1].status },
  { points: [[45.88, 8.54], [45.49, 9.20]] as [number,number][],       mode: "train",  status: legs[2].status },
  { points: [[45.49, 9.20], [43.78, 11.25]] as [number,number][],      mode: "train",  status: legs[3].status },
  { points: [[43.78, 11.25], [43.07, 11.72]] as [number,number][],     mode: "car",    status: legs[4].status },
  { points: [[43.07, 11.72], [41.80, 12.25]] as [number,number][],     mode: "car",    status: legs[5].status },
  { points: [[41.80, 12.25], [41.14, 16.76]] as [number,number][],     mode: "flight", status: legs[6].status },
  { points: [[41.14, 16.76], [40.73, 17.59]] as [number,number][],     mode: "car",    status: legs[7].status },
  { points: [[41.14, 16.76], [39.25, 9.05]] as [number,number][],      mode: "flight", status: legs[8].status },
  { points: [[39.25, 9.05], [39.22, 9.12]] as [number,number][],       mode: "car",    status: legs[9].status },
  { points: RETURN_ARC,                                                 mode: "flight", status: legs[10].status },
];

const MODE_COLORS: Record<string, string> = {
  flight: "#C45C3A",
  train:  "#1D6B9E",
  car:    "#466A42",
};

export default function MapView({ onLocationSelect, activeTheme }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<LMap | null>(null);
  const tileRef      = useRef<ReturnType<typeof import("leaflet")["tileLayer"]> | null>(null);
  const polylinesRef = useRef<Polyline[]>([]);

  // Keep a stable ref to the callback so we never need it as a dep
  const onSelectRef = useRef(onLocationSelect);
  useEffect(() => { onSelectRef.current = onLocationSelect; }, [onLocationSelect]);

  // Build the map once on mount
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      // Fix missing icons in bundled Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current, {
        center: [44.5, 12.5],
        zoom: 5,
        zoomControl: false,
        scrollWheelZoom: true,
      });
      mapRef.current = map;

      const theme = TILES[activeTheme] || TILES.amalfi;
      tileRef.current = L.tileLayer(theme.url, {
        attribution: theme.attribution,
        maxZoom: 18,
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Route lines
      ROUTE_SEGMENTS.forEach(seg => {
        const isBooked = seg.status === "booked";
        L.polyline(seg.points, {
          color: MODE_COLORS[seg.mode],
          weight: seg.mode === "flight" ? 2.5 : 3,
          opacity: isBooked ? 0.95 : 0.45,
          dashArray: isBooked ? (seg.mode === "flight" ? "8 5" : undefined) : "6 6",
          lineJoin: "round",
          lineCap: "round",
        }).addTo(map);
      });

      // Stay pins — highest z-index
      stays.forEach(stay => {
        const icon = L.divIcon({
          html: `<div class="pin-stay">
            <span class="pin-emoji">${stay.emoji}</span>
            <span class="pin-label">${stay.location.name.split(",")[0]}</span>
          </div>`,
          className: "pin-wrapper",
          iconSize: [80, 52],
          iconAnchor: [40, 52],
        });
        const marker = L.marker(stay.location.coords, { icon, zIndexOffset: 1000 });
        marker.on("click", (e) => {
          // Stop propagation so map.on("click") doesn't immediately clear the selection
          L.DomEvent.stopPropagation(e);
          onSelectRef.current(stay);
        });
        marker.addTo(map);
      });

      // Activity pins — mid z-index
      activities.forEach(act => {
        const icon = L.divIcon({
          html: `<div class="pin-activity">
            <span class="pin-emoji pin-emoji-sm">${act.emoji}</span>
            <span class="pin-label pin-label-sm">${act.name.split(",")[0]}</span>
          </div>`,
          className: "pin-wrapper",
          iconSize: [72, 44],
          iconAnchor: [36, 44],
        });
        const marker = L.marker(act.location.coords, { icon, zIndexOffset: 500 });
        marker.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectRef.current(act);
        });
        marker.addTo(map);
      });

      // Transit waypoint labels — lowest z-index, not clickable
      const transitPoints: [number, number][] = [
        [45.63, 8.73], [45.49, 9.20], [43.78, 11.25],
        [41.80, 12.25], [41.14, 16.76], [39.25, 9.05], [49.01, 2.55],
      ];
      const transitLabels = ["MXP", "Milano", "Firenze", "Roma", "Bari", "Cagliari", "CDG"];
      transitPoints.forEach(([lat, lng], i) => {
        L.marker([lat, lng], {
          icon: L.divIcon({
            html: `<div class="pin-transit">${transitLabels[i]}</div>`,
            className: "pin-wrapper",
            iconSize: [56, 18],
            iconAnchor: [28, 9],
          }),
          zIndexOffset: 0,
          interactive: false,
        }).addTo(map);
      });

      // NYC home pin
      L.marker([40.64, -73.78], {
        icon: L.divIcon({
          html: `<div class="pin-home">🏠 NYC</div>`,
          className: "pin-wrapper",
          iconSize: [64, 24],
          iconAnchor: [32, 12],
        }),
        interactive: false,
      }).addTo(map);

      // Clicking bare map deselects — only after pins had a chance to stop propagation
      map.on("click", () => onSelectRef.current(null));
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        polylinesRef.current = [];
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only run once — theme changes handled below

  // Swap tile layer when theme changes (without rebuilding the whole map)
  useEffect(() => {
    if (!mapRef.current || !tileRef.current) return;
    import("leaflet").then(({ default: L }) => {
      if (!mapRef.current) return;
      tileRef.current?.remove();
      const theme = TILES[activeTheme] || TILES.amalfi;
      tileRef.current = L.tileLayer(theme.url, {
        attribution: theme.attribution,
        maxZoom: 18,
      }).addTo(mapRef.current!);
    });
  }, [activeTheme]);

  return (
    <>
      <div ref={containerRef} className="w-full h-full" />
      <style>{`
        .pin-wrapper { background: transparent !important; border: none !important; }

        .pin-stay, .pin-activity {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: transform 0.15s ease;
          filter: drop-shadow(0 2px 6px rgba(0,0,0,0.22));
        }
        .pin-stay:hover, .pin-activity:hover { transform: scale(1.18); }

        .pin-emoji { font-size: 26px; line-height: 1; display: block; }
        .pin-emoji-sm { font-size: 20px; }

        .pin-label {
          margin-top: 3px;
          font-size: 10px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          background: #fff;
          color: #1C1917;
          padding: 1px 6px;
          border-radius: 4px;
          white-space: nowrap;
          box-shadow: 0 1px 4px rgba(0,0,0,0.18);
        }
        .pin-label-sm { font-size: 9px; padding: 1px 4px; }

        .pin-transit {
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(3px);
          border: 1px solid rgba(0,0,0,0.12);
          border-radius: 3px;
          padding: 1px 5px;
          font-size: 9px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          color: #666;
          white-space: nowrap;
          pointer-events: none;
        }

        .pin-home {
          background: #fff;
          border: 1.5px solid #C45C3A;
          border-radius: 5px;
          padding: 2px 6px;
          font-size: 10px;
          font-weight: 700;
          font-family: 'Inter', sans-serif;
          color: #C45C3A;
          white-space: nowrap;
          pointer-events: none;
        }

        /* Dark theme overrides */
        .theme-notte .pin-transit {
          background: rgba(30,30,50,0.88);
          border-color: rgba(255,255,255,0.12);
          color: #aaa;
        }
        .theme-notte .pin-label {
          background: rgba(30,30,50,0.9);
          color: #eee;
        }
        .theme-notte .pin-home {
          background: rgba(30,30,50,0.9);
        }
      `}</style>
    </>
  );
}
