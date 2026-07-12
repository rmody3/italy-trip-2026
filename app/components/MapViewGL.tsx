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
  amalfi: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  capri:  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  notte:  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
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
const routeLayer: LayerProps = {
  id: "routes",
  type: "line",
  paint: {
    "line-color": [
      "match", ["get", "mode"],
      "flight", "#C45C3A",
      "train",  "#1D6B9E",
      "car",    "#466A42",
      "#888",
    ],
    "line-width": ["match", ["get", "mode"], "flight", 2, 3],
    "line-opacity": ["match", ["get", "status"], "booked", 0.9, 0.4],
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
      "flight", "#C45C3A",
      "train",  "#1D6B9E",
      "car",    "#466A42",
      "#888",
    ],
    "line-width": 8,
    "line-opacity": 0.12,
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
    "circle-radius": 4,
    "circle-color": "#fff",
    "circle-stroke-color": "#aaa",
    "circle-stroke-width": 1.5,
    "circle-opacity": 0.85,
  },
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function MapViewGL({ onLocationSelect, activeTheme }: Props) {
  const mapRef = useRef<MapRef>(null);

  const handleMapClick = useCallback(() => {
    onLocationSelect(null);
  }, [onLocationSelect]);

  const style = MAP_STYLES[activeTheme] ?? MAP_STYLES.amalfi;

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

      {/* Stay pins */}
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

      {/* Activity pins */}
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
        .pin-emoji { font-size: 28px; line-height: 1; }
        .pin-emoji-sm { font-size: 22px; line-height: 1; }
        .pin-label {
          margin-top: 3px;
          font-size: 10px;
          font-weight: 700;
          font-family: var(--font-sans), 'Inter', sans-serif;
          background: white;
          color: #1C1917;
          padding: 1px 6px;
          border-radius: 4px;
          white-space: nowrap;
          box-shadow: 0 1px 4px rgba(0,0,0,0.18);
          letter-spacing: 0.01em;
        }
        .maplibregl-ctrl-attrib { display: none; }
        /* Smooth zoom/pan */
        .maplibregl-map canvas { outline: none; }
      `}</style>
    </Map>
  );
}
