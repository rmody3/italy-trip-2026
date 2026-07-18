"use client";

import { useRef, useCallback } from "react";
import Map, {
  Source, Layer, Marker, NavigationControl, type MapRef,
} from "react-map-gl/maplibre";
import type { LayerProps } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { motion } from "framer-motion";
import { stays, activities, stayToPlace, activityToPlace } from "../data/trip";
import type { SelectedPlace } from "../data/trip";

interface Props {
  onLocationSelect: (item: SelectedPlace | null) => void;
  activeTheme: string;
}

// ── Map styles (CARTO vector tiles — no API key required) ─────────────────────
const MAP_STYLES: Record<string, string> = {
  travertine: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  basalt:     "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
};

// ── GeoJSON routes ─────────────────────────────────────────────────────────────
// GeoJSON uses [lng, lat] order (opposite of Leaflet)
const TRANSATLANTIC_COORDS = [
  [-73.78, 40.64], [-60.0, 43.0], [-40.0, 47.0],
  [-20.0, 50.0], [-5.0, 50.5], [5.0, 47.5], [8.73, 45.63],
];
const RETURN_COORDS = [
  [9.05, 39.25], [5.0, 42.0], [3.0, 46.0], [2.55, 49.01],
  [-5.0, 53.0], [-20.0, 52.0], [-40.0, 47.0], [-60.0, 43.5], [-73.78, 40.64],
];

const ROUTES_GEOJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    // Transatlantic outbound
    { type: "Feature", properties: { mode: "flight", status: "pending" },
      geometry: { type: "LineString", coordinates: TRANSATLANTIC_COORDS } },
    // Italy legs
    { type: "Feature", properties: { mode: "train", status: "pending" },
      geometry: { type: "LineString", coordinates: [[8.73, 45.63], [8.54, 45.88]] } },
    { type: "Feature", properties: { mode: "train", status: "pending" },
      geometry: { type: "LineString", coordinates: [[8.54, 45.88], [9.20, 45.49]] } },
    { type: "Feature", properties: { mode: "train", status: "booked" },
      geometry: { type: "LineString", coordinates: [[9.20, 45.49], [11.25, 43.78]] } },
    { type: "Feature", properties: { mode: "car", status: "pending" },
      geometry: { type: "LineString", coordinates: [[11.25, 43.78], [11.72, 43.07]] } },
    { type: "Feature", properties: { mode: "car", status: "pending" },
      geometry: { type: "LineString", coordinates: [[11.72, 43.07], [12.25, 41.80]] } },
    { type: "Feature", properties: { mode: "flight", status: "booked" },
      geometry: { type: "LineString", coordinates: [[12.25, 41.80], [16.76, 41.14]] } },
    { type: "Feature", properties: { mode: "car", status: "pending" },
      geometry: { type: "LineString", coordinates: [[16.76, 41.14], [17.59, 40.73]] } },
    { type: "Feature", properties: { mode: "flight", status: "pending" },
      geometry: { type: "LineString", coordinates: [[16.76, 41.14], [9.05, 39.25]] } },
    { type: "Feature", properties: { mode: "car", status: "pending" },
      geometry: { type: "LineString", coordinates: [[9.05, 39.25], [9.12, 39.22]] } },
    // Return
    { type: "Feature", properties: { mode: "flight", status: "booked" },
      geometry: { type: "LineString", coordinates: RETURN_COORDS } },
  ],
};

// ── Layer styles ───────────────────────────────────────────────────────────────
// Earthed route palette — matches the Travertine trip colors, so the arcs read
// as aged ink over the parchment map rather than bright web-map lines.
const routeLayer: LayerProps = {
  id: "routes",
  type: "line",
  paint: {
    "line-color": [
      "match", ["get", "mode"],
      "flight", "#A65E38",   // terracotta ochre
      "train",  "#3F6470",   // slate
      "car",    "#5E6B48",   // olive-sage
      "#7A6F58",
    ],
    "line-width": ["match", ["get", "mode"], "flight", 2, 2.5],
    "line-opacity": ["match", ["get", "status"], "booked", 0.85, 0.42],
    "line-dasharray": ["match", ["get", "mode"], "flight", ["literal", [3, 3]], ["literal", [1, 0]]],
  },
  layout: { "line-join": "round", "line-cap": "round" },
};

const routeGlowLayer: LayerProps = {
  id: "routes-glow",
  type: "line",
  filter: ["==", ["get", "status"], "booked"],
  paint: {
    "line-color": [
      "match", ["get", "mode"],
      "flight", "#A65E38",
      "train",  "#3F6470",
      "car",    "#5E6B48",
      "#7A6F58",
    ],
    "line-width": 8,
    "line-opacity": 0.1,
    "line-blur": 4,
  },
  layout: { "line-join": "round", "line-cap": "round" },
};

// Transit waypoint dots layer
const TRANSIT_POINTS_GEOJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { label: "MXP" },   geometry: { type: "Point", coordinates: [8.73, 45.63] } },
    { type: "Feature", properties: { label: "Milano" }, geometry: { type: "Point", coordinates: [9.20, 45.49] } },
    { type: "Feature", properties: { label: "Firenze" },geometry: { type: "Point", coordinates: [11.25, 43.78] } },
    { type: "Feature", properties: { label: "Roma" },   geometry: { type: "Point", coordinates: [12.25, 41.80] } },
    { type: "Feature", properties: { label: "Bari" },   geometry: { type: "Point", coordinates: [16.76, 41.14] } },
    { type: "Feature", properties: { label: "Cagliari" },geometry: { type: "Point", coordinates: [9.05, 39.25] } },
    { type: "Feature", properties: { label: "CDG" },    geometry: { type: "Point", coordinates: [2.55, 49.01] } },
    { type: "Feature", properties: { label: "NYC" },    geometry: { type: "Point", coordinates: [-73.78, 40.64] } },
  ],
};

const transitDotLayer: LayerProps = {
  id: "transit-dots",
  type: "circle",
  paint: {
    "circle-radius": 3.5,
    "circle-color": "#F1EADA",       // limestone
    "circle-stroke-color": "#8A7B62", // travertine
    "circle-stroke-width": 1.25,
    "circle-opacity": 0.9,
  },
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function MapViewGL({ onLocationSelect, activeTheme }: Props) {
  const mapRef = useRef<MapRef>(null);

  const handleMapClick = useCallback(() => {
    onLocationSelect(null);
  }, [onLocationSelect]);

  const style = MAP_STYLES[activeTheme] ?? MAP_STYLES.travertine;

  // Warm, low-saturation wash over the tile canvas so the basemap reads as an
  // aged parchment map that belongs to the Travertine palette. Applied to the
  // GL canvas only — the HTML pin markers sit above it and stay untinted.
  const canvasFilter =
    activeTheme === "basalt"
      ? "saturate(0.85) brightness(0.96) sepia(0.08)"
      : "saturate(0.6) sepia(0.16) contrast(0.96) brightness(1.03)";

  return (
    <Map
      ref={mapRef}
      mapStyle={style}
      initialViewState={{ longitude: 12, latitude: 44, zoom: 4.8 }}
      style={{ width: "100%", height: "100%" }}
      onClick={handleMapClick}
      attributionControl={false}
    >
      {/* Route glow for booked legs */}
      <Source id="routes-src" type="geojson" data={ROUTES_GEOJSON}>
        <Layer {...routeGlowLayer} />
        <Layer {...routeLayer} />
      </Source>

      {/* Transit waypoint dots */}
      <Source id="transit-src" type="geojson" data={TRANSIT_POINTS_GEOJSON}>
        <Layer {...transitDotLayer} />
      </Source>

      {/* Activity pins — drawn first so nearby stay labels stack on top of them */}
      {activities.map(act => (
        <Marker
          key={act.id}
          longitude={act.location.coords[1]}
          latitude={act.location.coords[0]}
          anchor="bottom"
          onClick={e => {
            e.originalEvent.stopPropagation();
            onLocationSelect(activityToPlace(act));
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.15 }}
            transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.05 }}
            className="pin-activity cursor-pointer"
          >
            <span className="pin-emoji-sm">{act.emoji}</span>
          </motion.div>
        </Marker>
      ))}

      {/* Stay pins — primary markers, drawn last so their labels stay legible */}
      {stays.map(stay => (
        <Marker
          key={stay.id}
          longitude={stay.location.coords[1]}
          latitude={stay.location.coords[0]}
          anchor="bottom"
          onClick={e => {
            e.originalEvent.stopPropagation();
            onLocationSelect(stayToPlace(stay));
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.2 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="pin-stay cursor-pointer"
          >
            <span className="pin-emoji">{stay.emoji}</span>
            <span className="pin-label">{stay.location.name.split(",")[0]}</span>
          </motion.div>
        </Marker>
      ))}

      <NavigationControl position="bottom-right" showCompass={false} />

      <style>{`
        .pin-stay {
          display: flex;
          flex-direction: column;
          align-items: center;
          filter: drop-shadow(0 2px 6px rgba(0,0,0,0.25));
        }
        .pin-activity {
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 1px 4px rgba(0,0,0,0.2));
        }
        /* Stay pin — emoji set in a limestone medallion, like a wax seal on a map */
        .pin-emoji {
          font-size: 16px; line-height: 1;
          width: 30px; height: 30px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: var(--card, #F4EEE1);
          border: 1.5px solid var(--border, #C9BCA0);
          box-shadow: 0 2px 5px rgba(60,48,28,0.20);
          filter: saturate(0.9);
        }
        .pin-emoji-sm {
          font-size: 13px; line-height: 1;
          width: 24px; height: 24px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: var(--card, #F4EEE1);
          border: 1px solid var(--border, #C9BCA0);
          box-shadow: 0 1px 4px rgba(60,48,28,0.16);
          filter: saturate(0.82);
        }
        /* Engraved place label — Cinzel caps in a limestone chip, like the
           inscribed place names on an old map. */
        .pin-label {
          margin-top: 4px;
          font-size: 9px;
          font-weight: 600;
          font-family: var(--font-display), Georgia, serif;
          text-transform: uppercase;
          background: var(--card, #F4EEE1);
          color: var(--foreground, #33302A);
          padding: 2px 7px;
          border: 1px solid var(--border, #D2C7B2);
          border-radius: 3px;
          white-space: nowrap;
          box-shadow: 0 1px 3px rgba(60,48,28,0.14);
          letter-spacing: 0.14em;
        }
        .maplibregl-ctrl-attrib { display: none; }
        /* Parchment wash on the tile canvas (pins stay above, untinted) */
        .maplibregl-canvas { outline: none; filter: ${canvasFilter}; }
        /* Zoom control in the stone palette */
        .maplibregl-ctrl-group {
          background: var(--card, #F4EEE1) !important;
          border: 1px solid var(--border, #D2C7B2) !important;
          box-shadow: 0 2px 8px rgba(60,48,28,0.12) !important;
          border-radius: 5px !important;
          overflow: hidden;
        }
        .maplibregl-ctrl-group button {
          background: transparent !important;
          color: var(--foreground) !important;
        }
        .maplibregl-ctrl-group button + button { border-top: 1px solid var(--border, #D2C7B2) !important; }
        .maplibregl-ctrl-group button:hover { background: var(--muted, #E2D9C7) !important; }
      `}</style>
    </Map>
  );
}
