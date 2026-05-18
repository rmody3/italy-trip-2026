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

// ── Locations ──────────────────────────────────────────────────────────────────

const JFK: Location = { name: "New York JFK", coords: [40.6413, -73.7781], type: "airport", placeQuery: "JFK Airport New York" };
const MXP: Location = { name: "Milan Malpensa", coords: [45.6306, 8.7281], type: "airport", placeQuery: "Milan Malpensa Airport" };
const STRESA: Location = { name: "Stresa, Lake Maggiore", coords: [45.8832, 8.5355], type: "stay", placeQuery: "Stresa Lake Maggiore Italy" };
const MILAN_C: Location = { name: "Milano Centrale", coords: [45.4851, 9.2035], type: "station", placeQuery: "Milano Centrale Station" };
const FLORENCE: Location = { name: "Firenze SMN", coords: [43.7760, 11.2457], type: "station", placeQuery: "Santa Maria Novella Florence" };
const LUPAIA: Location = { name: "Lupaia, Tuscany", coords: [43.0667, 11.7167], type: "stay", placeQuery: "Lupaia Hotel Monticchiello Tuscany" };
const FCO: Location = { name: "Rome Fiumicino", coords: [41.7999, 12.2462], type: "airport", placeQuery: "Rome Fiumicino Airport FCO" };
const BRI: Location = { name: "Bari Airport", coords: [41.1387, 16.7624], type: "airport", placeQuery: "Bari Karol Wojtyla Airport" };
const OSTUNI: Location = { name: "Ostuni, Puglia", coords: [40.7285, 17.5888], type: "stay", placeQuery: "Ostuni Puglia Italy white city" };
const CAG: Location = { name: "Cagliari Airport", coords: [39.2548, 9.0540], type: "airport", placeQuery: "Cagliari Elmas Airport Sardinia" };
const SARDINIA: Location = { name: "Sardinia", coords: [39.2238, 9.1217], type: "stay", placeQuery: "Cagliari Sardinia Italy" };
const CDG: Location = { name: "Paris CDG", coords: [49.0097, 2.5479], type: "airport", placeQuery: "Charles de Gaulle Airport Paris" };

// ── Stays ──────────────────────────────────────────────────────────────────────

export const stays: Stay[] = [
  {
    id: "lake-maggiore",
    name: "Regina Palace Hotel",
    location: STRESA,
    checkIn: "Jul 22",
    checkOut: "Jul 26",
    nights: 4,
    description: "Grand lakeside hotel in Stresa for a friend's wedding celebration.",
    category: "hotel",
    emoji: "🏛️",
  },
  {
    id: "tuscany",
    name: "Lupaia Hotel",
    location: LUPAIA,
    checkIn: "Jul 26",
    checkOut: "Jul 29",
    nights: 3,
    description: "Hilltop boutique hotel near Monticchiello in the Val d'Orcia.",
    category: "villa",
    emoji: "🌿",
  },
  {
    id: "puglia",
    name: "Masseria le Carrube",
    location: OSTUNI,
    checkIn: "Jul 29",
    checkOut: "Aug 2",
    nights: 4,
    description: "Whitewashed masseria estate near the white city of Ostuni.",
    category: "masseria",
    emoji: "🫒",
  },
  {
    id: "sardinia",
    name: "Sardinia (TBD)",
    location: SARDINIA,
    checkIn: "Aug 2",
    checkOut: "Aug 6",
    nights: 4,
    description: "Four nights in Sardinia before the flight home from Cagliari.",
    category: "villa",
    emoji: "🏖️",
  },
];

// ── Legs ───────────────────────────────────────────────────────────────────────

export const legs: Leg[] = [
  {
    id: "leg1",
    from: JFK,
    to: MXP,
    mode: "flight",
    date: "Jul 22",
    departureTime: "21:55",
    arrivalTime: "12:05+1",
    carrier: "Delta",
    flightNumber: "DL184",
    price: "$957 for 2",
    status: "pending",
    notes: "Book on delta.com — nonstop JFK→MXP",
  },
  {
    id: "leg2",
    from: MXP,
    to: STRESA,
    mode: "train",
    date: "Jul 23",
    departureTime: "~13:00",
    arrivalTime: "~14:00",
    status: "pending",
    notes: "Walk-up ticket, Trenitalia MXP→Stresa (~1 hr, ~€15)",
  },
  {
    id: "leg3",
    from: STRESA,
    to: MILAN_C,
    mode: "train",
    date: "Jul 26",
    departureTime: "~09:00",
    status: "pending",
    notes: "Walk-up, morning train Stresa→Milan Centrale (~1 hr)",
  },
  {
    id: "leg4",
    from: MILAN_C,
    to: FLORENCE,
    mode: "train",
    date: "Jul 26",
    departureTime: "11:40",
    arrivalTime: "13:35",
    confirmation: "CCDUHP",
    carrier: "Italo",
    flightNumber: "Train 9931",
    price: "$155.58 for 2",
    status: "booked",
    notes: "Prima Business Flex · Coach 2 Seats 5 & 6",
  },
  {
    id: "leg5",
    from: FLORENCE,
    to: LUPAIA,
    mode: "car",
    date: "Jul 26",
    departureTime: "~14:00",
    arrivalTime: "~16:00",
    status: "pending",
    notes: "Rental car pickup Florence SMN/FLR, drop Rome FCO. ~$280+$100 one-way fee (AutoEurope)",
  },
  {
    id: "leg6",
    from: LUPAIA,
    to: FCO,
    mode: "car",
    date: "Jul 29",
    departureTime: "~11:00",
    status: "pending",
    notes: "Drive rental car to Rome FCO, return car there (~2.5 hrs from Lupaia)",
  },
  {
    id: "leg7",
    from: FCO,
    to: BRI,
    mode: "flight",
    date: "Jul 29",
    departureTime: "15:15",
    arrivalTime: "16:20",
    confirmation: "Z24DST",
    carrier: "ITA Airways",
    flightNumber: "AZ1607",
    price: "€174.10 for 2",
    status: "booked",
    notes: "Economy · Bari is ~90 min from Ostuni",
  },
  {
    id: "leg8",
    from: BRI,
    to: OSTUNI,
    mode: "car",
    date: "Jul 29",
    departureTime: "~16:30",
    status: "pending",
    notes: "Rental car BRI, Jul 29–Aug 2 (4 days). ~$150 via Kayak/ADDCAR",
  },
  {
    id: "leg9",
    from: BRI,
    to: CAG,
    mode: "flight",
    date: "Aug 2",
    departureTime: "08:15",
    arrivalTime: "09:45",
    carrier: "Ryanair",
    price: "$156 for 2",
    status: "pending",
    notes: "Only 2x/week — book soon! Then pickup Sardinia rental car at CAG.",
  },
  {
    id: "leg10",
    from: CAG,
    to: SARDINIA,
    mode: "car",
    date: "Aug 2",
    status: "pending",
    notes: "Rental car CAG, Aug 2–6 (4 days). ~$181 via Kayak/Dryyve (Opel Mokka SUV)",
  },
  {
    id: "leg11",
    from: CAG,
    to: CDG,
    mode: "flight",
    date: "Aug 6",
    departureTime: "12:30",
    arrivalTime: "14:45",
    confirmation: "XDQETZ",
    carrier: "Air France",
    flightNumber: "AF1111",
    price: "120K miles + $882",
    status: "booked",
    notes: "Business class",
  },
  {
    id: "leg12",
    from: CDG,
    to: JFK,
    mode: "flight",
    date: "Aug 6",
    departureTime: "20:30",
    arrivalTime: "22:40",
    confirmation: "XDQETZ",
    carrier: "Air France",
    flightNumber: "AF0012",
    price: "included above",
    status: "booked",
    notes: "Business class · home!",
  },
];

// ── Sample Activities ──────────────────────────────────────────────────────────

export const activities: Activity[] = [
  {
    id: "borromean",
    name: "Borromean Islands",
    location: { name: "Isola Bella", coords: [45.8992, 8.5108], type: "stay", placeQuery: "Isola Bella Borromean Islands" },
    date: "Jul 23–25",
    category: "attraction",
    emoji: "🏝️",
    notes: "Baroque palace gardens on the lake",
  },
  {
    id: "pienza",
    name: "Pienza",
    location: { name: "Pienza, Tuscany", coords: [43.0764, 11.6801], type: "stay", placeQuery: "Pienza Tuscany Italy" },
    date: "Jul 27",
    category: "attraction",
    emoji: "🗺️",
    notes: "Renaissance hilltop town, 15 min from Lupaia",
  },
  {
    id: "ostuni-town",
    name: "Ostuni Old Town",
    location: { name: "Ostuni Centro", coords: [40.7317, 17.5851], type: "stay", placeQuery: "Ostuni white city old town Puglia" },
    date: "Jul 30",
    category: "attraction",
    emoji: "🕌",
    notes: "The white city — stunning at sunset",
  },
];

// ── Timeline ───────────────────────────────────────────────────────────────────

export interface TimelineDay {
  date: string;
  dateShort: string;
  location: string;
  emoji: string;
  stay?: Stay;
  legs: Leg[];
  activities: Activity[];
}

export const timeline: TimelineDay[] = [
  { date: "July 22", dateShort: "Jul 22", location: "NYC → Milan", emoji: "✈️", legs: [legs[0]], activities: [] },
  { date: "July 22–26", dateShort: "Jul 22–26", location: "Lake Maggiore", emoji: "💒", stay: stays[0], legs: [legs[1]], activities: [activities[0]] },
  { date: "July 26", dateShort: "Jul 26", location: "Milan → Florence → Tuscany", emoji: "🚄", legs: [legs[2], legs[3], legs[4]], activities: [] },
  { date: "July 26–29", dateShort: "Jul 26–29", location: "Tuscany", emoji: "🌻", stay: stays[1], legs: [], activities: [activities[1]] },
  { date: "July 29", dateShort: "Jul 29", location: "Tuscany → Rome → Puglia", emoji: "🫒", legs: [legs[5], legs[6], legs[7]], activities: [] },
  { date: "July 29 – Aug 2", dateShort: "Jul 29–Aug 2", location: "Puglia", emoji: "🌊", stay: stays[2], legs: [], activities: [activities[2]] },
  { date: "August 2–6", dateShort: "Aug 2–6", location: "Sardinia", emoji: "🏖️", stay: stays[3], legs: [legs[8], legs[9]], activities: [] },
  { date: "August 6", dateShort: "Aug 6", location: "CAG → Paris → NYC", emoji: "🏠", legs: [legs[10], legs[11]], activities: [] },
];

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
