<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Italy Trip 2026 — Agent Briefing

**Live site:** https://italy-trip-lime.vercel.app  
**Trip dates:** July 22 – August 6, 2026  
**Travelers:** Rahul Mody + 1  
**Route:** New York → Milan (Lake Maggiore) → Florence/Tuscany → Puglia → Sardinia → Paris → New York

---

## The Golden Rule

**The Google Sheet is the source of truth.** Never edit `app/data/trip.generated.ts` by hand. The update flow is always:

```
Edit Google Sheet → npm run sync → commit → git push (Vercel auto-deploys)
```

Sheet ID: `1k6uIUhaXpoKKXNT2mrZUDjgBQneiYtpb94cKQgGkU5c`  
Auth: `gcloud auth print-access-token` (Drive scope). No credentials on Vercel.

---

## Sheet Structure

### `Transporation` tab (legs)
Columns: `CITY | FROM | TO | DEPARTURE | ARRIVAL | MODE | CONFIRMATION # | PAYMENT | DURATION`

- A leg is **booked** when `CONFIRMATION #` is non-empty and doesn't start with "TBD" or "Buy at station"
- `MODE` text is parsed for keywords: "rental car" / "car" → car, "train" → train, "flight number pattern" → flight
- Dates use `M/D/YYYY HH:MM` format

### `Itinerary` tab (daily plan)
Columns: `DATE | PLACE | STAY | ITINERARY | TRANSPORTATION | ACTIVITY`

- One row per day; `PLACE` carries forward if blank
- `ITINERARY` and `ACTIVITY` columns become bullet notes shown in the expanded day view

### `_DB` tab (enrichment — Claude maintains)
Columns: `Type | Key | Name | Lat | Lng | StopType | Emoji | Category | Aliases | Ref | Date | Notes | PlaceQuery`

- Row types: `PLACE` (airports, stations, landmarks), `STAY` (hotels), `ACTIVITY`
- `Aliases` is pipe-separated (`SMN|Firenze SMN|Florence SMN`) — used to resolve loose text in FROM/TO fields
- When sync warns `⚠ unresolved place "X"`, add a PLACE row to `_DB` with appropriate aliases

---

## Itinerary at a Glance

| Dates | Region | Stay | Status |
|-------|--------|------|--------|
| Jul 23–26 | Lake Maggiore | Regina Palace Hotel, Stresa | ✅ (wedding) |
| Jul 26–29 | Tuscany | Lupaia Hotel, Monticchiello (Val d'Orcia) | ✅ |
| Jul 29–Aug 2 | Puglia | Masseria le Carrube, Ostuni | ✅ |
| Aug 2–6 | Sardinia | TBD | ✅ |

### Transport bookings
| Leg | Details | Status |
|-----|---------|--------|
| JFK → MXP | Delta DL184, Jul 22 | pending (TBD on delta.com) |
| MXP → Stresa | Trenord regional train | buy at station |
| Stresa → Milano Centrale | Trenord regional train | buy at station |
| Milano Centrale → Firenze SMN | Italo 9931, Jul 26 11:40 | ✅ CCDUHP |
| Florence SMN → Tuscany → Rome FCO | Hertz rental car, Jeep Avenger, Jul 26–29 | ✅ L64746533C6 |
| FCO → BRI | ITA AZ1607, Jul 29 | ✅ Z24DST |
| BRI → BRI | Rental car, Jul 29–Aug 2 | **pending** |
| BRI → CAG | Ryanair, Aug 2 | ✅ TSCHHB |
| CAG → CAG | Rental car, Aug 2–6 | **pending** |
| CAG → CDG → JFK | Air France AF1111/AF0012, Aug 6 (Business) | ✅ XDQETZ |

---

## Codebase Map

```
app/
  page.tsx              # Root layout: TripPanel (left) + MapViewGL (right, desktop only)
  data/
    trip.ts             # Types + modeColors/modeIcons + re-exports from generated
    trip.generated.ts   # ⚠ AUTO-GENERATED — do not edit
  components/
    TripPanel.tsx       # Left sidebar: progress bar, stats, timeline days, legs
    MapViewGL.tsx       # MapLibre GL map with stay pins and leg arcs
    LocationSheet.tsx   # Bottom sheet shown when a map pin is clicked
    PlaceHoverCard.tsx  # Hover card for place names in the timeline
components/ui/          # shadcn/ui primitives (badge, button, card, etc.)
scripts/
  sync-sheet.mjs        # The sync script — reads Sheet, writes trip.generated.ts
```

---

## Running Locally

```bash
npm install
npm run dev          # http://localhost:3000
npm run sync         # Pull latest from Google Sheet (needs gcloud auth)
npm test             # Vitest unit tests
npx playwright test  # E2E tests
```

---

## Agent Task Types

### Research agents (no code changes needed)
These agents search the web and return findings to be added to the Sheet's Itinerary tab:

- **Reddit research** — search r/italy, r/ItalyTravel, r/solotravel for tips on specific regions. Good queries: `site:reddit.com italy [region] [month] tips`, `puglia ostuni what to do`, `sardinia cagliari day trips`
- **Restaurant research** — find top-rated restaurants in each region for the travel dates. Check Google Maps, TripAdvisor, The Fork, local food blogs
- **Activity research** — find things to do: day trips from Ostuni, beaches in Sardinia, Val d'Orcia drives, etc.
- **Practical tips** — ZTL zones, ferry schedules, beach parking, agritourism bookings

When an agent finds something good, the result should be added to the `Itinerary` tab `ACTIVITY` or `ITINERARY` column for the relevant date, then `npm run sync` + commit.

### Booking agents (use AutoEurope for cars)
- Car rentals via https://www.autoeurope.com — search, compare, book
- After booking, update the `Transporation` sheet row with the confirmation number and run sync
- **Important:** Chrome DevTools MCP shares a single browser — run booking agents sequentially, not in parallel

### UI agents (edit components, then sync + deploy)
- All data comes from the Sheet — UI changes are purely presentational
- Never hardcode trip data in components; read from `trip.ts` exports
- After any component change: `npm run build` to verify, then commit + push

---

## Key Constraints

- **Automatic transmission only** on all rental cars (Rahul's requirement)
- **IDP required** in Italy for US drivers — apply at aaa.com/vacation/idpf.html (~$20)
- **ZTL zones** in Florence city center — pick up car at SMN station and drive out directly, do not enter the historic center
- Pickup/dropoff always at airports or train stations (no city center detours)
- Dhrumi Amex is the payment card for bookings (4 digit CVV required at booking)
