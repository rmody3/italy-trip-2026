export type TransportMode = "flight" | "train" | "car" | "taxi";
export type StopType = "stay" | "airport" | "station";

export interface Location {
  name: string;
  coords: [number, number]; // [lat, lng]
  type: StopType;
  placeQuery?: string; // for Google Maps search
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
