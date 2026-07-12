export type TransportMode = "flight" | "train" | "car" | "taxi";
export type StopType = "stay" | "airport" | "station";

export interface Location {
  name: string;
  coords: [number, number]; // [lat, lng]
  type: StopType;
  placeQuery?: string; // exact Google Maps search query for THIS place
  photo?: string;      // /photos/<key>.jpg baked at sync time (optional)
}

export interface Stay {
  id: string;
  name: string;
  location: Location;
  checkIn: string;
  checkOut: string;
  nights: number;
  description: string;
  category: "hotel" | "masseria" | "villa";
  emoji: string;
}

export interface Leg {
  id: string;
  from: Location;
  to: Location;
  mode: TransportMode;
  date: string;
  departureTime?: string;
  arrivalTime?: string;
  confirmation?: string;
  carrier?: string;
  flightNumber?: string;
  price?: string;
  status: "booked" | "pending";
  notes?: string;
}

export interface Activity {
  id: string;
  name: string;
  location: Location;
  date?: string;
  category: "restaurant" | "attraction" | "beach" | "winery" | "activity";
  emoji: string;
  notes?: string;
}

// ── Selectable place ────────────────────────────────────────────────────────────
// Anything the user can tap (a stay, an activity, or a transport endpoint) is
// normalized into this shape so the LocationSheet can show it and link to the
// EXACT place with an accurate Google Maps query.

export interface SelectedPlace {
  name: string;
  query: string;       // exact Google Maps search query
  subtitle?: string;
  emoji?: string;
  description?: string;
  photo?: string;
  mapCoords?: [number, number]; // [lat, lng] fallback for the embedded map
}

const STOP_EMOJI: Record<StopType, string> = { airport: "✈️", station: "🚉", stay: "📍" };

export function stayToPlace(s: Stay): SelectedPlace {
  return {
    name: s.name,
    query: s.location.placeQuery ?? s.name,
    subtitle: `${s.location.name} · ${s.checkIn} – ${s.checkOut} · ${s.nights} nights`,
    emoji: s.emoji,
    description: s.description,
    photo: s.location.photo,
    mapCoords: s.location.coords,
  };
}

export function activityToPlace(a: Activity): SelectedPlace {
  return {
    name: a.name,
    query: a.location.placeQuery ?? a.name,
    subtitle: [a.date, a.category].filter(Boolean).join(" · "),
    emoji: a.emoji,
    description: a.notes,
    photo: a.location.photo,
    mapCoords: a.location.coords,
  };
}

// A transport endpoint (airport, station, car pickup) → its exact place.
export function locationToPlace(loc: Location, subtitle?: string): SelectedPlace {
  return {
    name: loc.name,
    query: loc.placeQuery ?? loc.name,
    subtitle: subtitle ?? loc.type.charAt(0).toUpperCase() + loc.type.slice(1),
    emoji: STOP_EMOJI[loc.type],
    photo: loc.photo,
    mapCoords: loc.coords,
  };
}

// ── Timeline ───────────────────────────────────────────────────────────────────

export interface TimelineDay {
  date: string;
  dateShort: string;
  location: string;
  emoji: string;
  stay?: Stay;
  legs: Leg[];
  activities: Activity[];
  notes?: string[]; // day-by-day plans pulled from the Itinerary tab
}

// ── Data ─────────────────────────────────────────────────────────────────────
// The trip content lives in the Google Sheet (source of truth). Run `npm run sync`
// to regenerate ./trip.generated.ts from it, then commit + deploy.
export { stays, legs, activities, timeline } from "./trip.generated";

export const modeColors: Record<TransportMode, string> = {
  flight: "#6366f1",
  train: "#10b981",
  car: "#f59e0b",
  taxi: "#ec4899",
};

export const modeIcons: Record<TransportMode, string> = {
  flight: "✈️",
  train: "🚄",
  car: "🚗",
  taxi: "🚕",
};
