#!/usr/bin/env node
// Sync the Italy trip data FROM the Google Sheet (the source of truth) into
// app/data/trip.generated.ts.
//
//   Content tabs (you edit):   "Itinerary", "Transporation"
//   Enrichment tab (auto):     "_DB"  -> coords, emoji, category, aliases
//
// Auth: uses your local `gcloud auth print-access-token` (Drive scope). Nothing
// is stored in the app or on Vercel. Run `npm run sync`, then commit + deploy.

import { execSync } from "node:child_process";
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SHEET = "1k6uIUhaXpoKKXNT2mrZUDjgBQneiYtpb94cKQgGkU5c";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "app", "data", "trip.generated.ts");
const PHOTOS_DIR = join(ROOT, "public", "photos");
const UA = { "User-Agent": "italy-trip-sync/1.0 (personal trip planner)" };
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function token() {
  try { return execSync("gcloud auth print-access-token", { encoding: "utf8" }).trim(); }
  catch { console.error("✗ Could not get a token. Run: gcloud auth login"); process.exit(1); }
}

async function values(tab) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET}/values/${encodeURIComponent(tab)}!A1:Z200`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!r.ok) { console.error(`✗ ${tab}: ${r.status} ${await r.text()}`); process.exit(1); }
  return (await r.json()).values || [];
}

const TOKEN = token();
const norm = (s) => (s || "").toLowerCase().replace(/\s+/g, " ").trim();

// ── date helpers ────────────────────────────────────────────────────────────
function parseDate(str) {
  const m = String(str || "").match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!m) return null;
  let [, mo, d, y] = m.map(Number);
  if (y < 100) y += 2000;
  const rest = String(str).slice(m.index + m[0].length).trim();
  const time = rest.match(/(\d{1,2}:\d{2})/);
  const word = rest.match(/(morning|afternoon|evening|night|noon)/i);
  return { y, m: mo, d, num: Date.UTC(y, mo - 1, d), time: time ? time[1] : word ? word[1] : "" };
}
const mdShort = (dt) => `${MONTHS[dt.m - 1]} ${dt.d}`;
const longMonth = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function rangeLabel(a, b, longForm) {
  const mn = longForm ? longMonth : MONTHS;
  if (a.num === b.num) return `${mn[a.m - 1]} ${a.d}`;
  if (a.m === b.m) return `${mn[a.m - 1]} ${a.d}–${b.d}`;
  return `${mn[a.m - 1]} ${a.d} – ${MONTHS[b.m - 1]} ${b.d}`;
}
function parseActDate(str) {
  const m = String(str || "").match(/([A-Za-z]{3,})\s+(\d{1,2})/);
  if (!m) return null;
  const mi = MONTHS.findIndex((x) => x.toLowerCase() === m[1].slice(0, 3).toLowerCase());
  return mi < 0 ? null : Date.UTC(2026, mi, Number(m[2]));
}

// ── _DB tab -> places / stays / activities ──────────────────────────────────
const db = await values("_DB");
const dbRows = db.slice(1).filter((r) => r[0] && !r[0].startsWith("#"));
const col = { Type: 0, Key: 1, Name: 2, Lat: 3, Lng: 4, StopType: 5, Emoji: 6, Category: 7, Aliases: 8, Ref: 9, Date: 10, Notes: 11, PlaceQuery: 12, Photo: 13 };
const g = (r, c) => (r[col[c]] || "").trim();

const placeRows = dbRows.filter((r) => g(r, "Type") === "PLACE");
const stayRows = dbRows.filter((r) => g(r, "Type") === "STAY");
const actRows = dbRows.filter((r) => g(r, "Type") === "ACTIVITY");

// ── Photos (keyless): the _DB "Photo" column is either a direct image URL or
// "wiki:<Wikipedia Title>". We download the first real photo to public/photos/
// <key>.jpg once (cached), so the app ships local images and no keys. Places
// without a usable photo fall back to the embedded map in the drawer.
async function wikiImage(title) {
  const api = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&piprop=thumbnail&pithumbsize=1000&format=json&redirects=1`;
  const r = await fetch(api, { headers: UA });
  if (!r.ok) return null;
  const page = Object.values((await r.json()).query.pages)[0];
  const src = page?.thumbnail?.source;
  if (!src || /\.svg/i.test(src)) return null; // skip logos / vector maps
  return src;
}
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
async function fetchImage(url) {
  // one retry with backoff — Wikimedia rate-limits rapid sequential fetches
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await fetch(url, { headers: UA });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    if (r.status === 429) await sleep(1500);
    else return null;
  }
  return null;
}
async function ensurePhoto(key, spec) {
  const dest = join(PHOTOS_DIR, `${key}.jpg`);
  const rel = `/photos/${key}.jpg`;
  if (existsSync(dest)) return rel; // cached — never re-fetch
  try {
    const url = spec.startsWith("http") ? spec : spec.startsWith("wiki:") ? await wikiImage(spec.slice(5)) : null;
    if (!url) return null;
    const buf = await fetchImage(url);
    if (!buf || buf.length < 1500) return null; // missing / too small to be a real photo
    mkdirSync(PHOTOS_DIR, { recursive: true });
    writeFileSync(dest, buf);
    console.log(`  📷 ${key}`);
    return rel;
  } catch (e) {
    console.warn(`  ⚠ photo ${key}: ${e.message}`);
    return null;
  }
}
const photoMap = new Map();
for (const r of dbRows) {
  const key = g(r, "Key"), spec = g(r, "Photo");
  if (!key || !spec) continue;
  const cached = existsSync(join(PHOTOS_DIR, `${key}.jpg`));
  const p = await ensurePhoto(key, spec);
  if (p) photoMap.set(key, p);
  if (!cached) await sleep(350); // be gentle with Wikimedia on fresh fetches
}

// place lookup for resolving Transportation FROM/TO + Itinerary Place labels
const placeByAlias = new Map();
const placeByKey = new Map();
for (const r of placeRows) {
  const p = {
    key: g(r, "Key"), name: g(r, "Name"),
    lat: g(r, "Lat"), lng: g(r, "Lng"),
    stop: g(r, "StopType"), emoji: g(r, "Emoji"), pq: g(r, "PlaceQuery"),
    photo: photoMap.get(g(r, "Key")) || "",
  };
  placeByKey.set(norm(p.key), p);
  placeByAlias.set(norm(p.key), p);
  for (const a of g(r, "Aliases").split("|").map(norm).filter(Boolean)) placeByAlias.set(a, p);
}
function location(token) {
  const t = norm(token);
  let p = placeByAlias.get(t);
  if (!p) for (const [alias, cand] of placeByAlias) if (t.includes(alias) || alias.includes(t)) { p = cand; break; }
  if (!p) { console.warn(`⚠ unresolved place "${token}" — add it to _DB`); p = { name: token, lat: "0", lng: "0", stop: "stay", pq: "" }; }
  const loc = { name: p.name, coords: [Number(p.lat) || 0, Number(p.lng) || 0], type: p.stop || "stay" };
  if (p.pq) loc.placeQuery = p.pq;
  if (p.photo) loc.photo = p.photo;
  return loc;
}
const labelEmoji = (label) => (placeByKey.get(norm(label))?.emoji) || "";

// ── Transporation tab -> legs ───────────────────────────────────────────────
const T = { CITY: 0, FROM: 1, TO: 2, DEP: 3, ARR: 4, MODE: 5, CONF: 6, PAY: 7, DUR: 8 };
const trans = (await values("Transporation")).slice(1).filter((r) => r[T.FROM]);
const legs = trans.map((r, i) => {
  const modeStr = r[T.MODE] || "";
  let mode = "flight";
  if (/rental car|\bcar\b|drive/i.test(modeStr)) mode = "car";
  if (/train/i.test(modeStr)) mode = "train";
  if (/taxi/i.test(modeStr)) mode = "taxi";

  const trainNo = modeStr.match(/Train\s*\d+/i);
  const fnMatch = modeStr.match(/\b([A-Z]{2}\d{2,4}[A-Z]?)\b/);
  const flightNumber = mode === "train" && trainNo ? trainNo[0] : fnMatch ? fnMatch[0] : undefined;
  let head = flightNumber ? modeStr.slice(0, modeStr.indexOf(flightNumber)) : modeStr.split(" - ")[0];
  head = head.replace(/\bTrain\b/i, "").replace(/[-–]\s*$/, "").trim();
  const carrier = head || undefined;

  const dep = parseDate(r[T.DEP]);
  const arr = parseDate(r[T.ARR]);
  let arrivalTime = arr?.time || undefined;
  if (dep && arr && arr.num > dep.num && arrivalTime) arrivalTime += "+1";

  const rawConf = (r[T.CONF] || "").trim();
  const booked = rawConf && !/^tbd\b|buy at station|see leg/i.test(rawConf);

  const detail = modeStr.includes(" - ") ? modeStr.split(" - ").slice(1).join(" - ").trim() : "";
  const notes = [detail, (r[T.DUR] || "").trim()].filter(Boolean).join(" · ") || undefined;

  const leg = {
    id: `leg${i + 1}`, from: location(r[T.FROM]), to: location(r[T.TO]), mode,
    date: dep ? mdShort(dep) : "", status: booked ? "booked" : "pending",
    _depNum: dep?.num ?? null,
  };
  if (dep?.time) leg.departureTime = dep.time;
  if (arrivalTime) leg.arrivalTime = arrivalTime;
  if (booked) leg.confirmation = rawConf;
  if (carrier) leg.carrier = carrier;
  if (flightNumber) leg.flightNumber = flightNumber;
  if (r[T.PAY]) leg.price = r[T.PAY].trim();
  if (notes) leg.notes = notes;
  return leg;
});

// ── Itinerary tab -> place blocks (drive stays, timeline, day notes) ─────────
const I = { DATE: 0, PLACE: 1, STAY: 2, ITIN: 3, TRANS: 4, ACT: 5 };
const itin = (await values("Itinerary")).slice(1);
const blocks = [];
let cur = null, lastPlace = "";
for (const row of itin) {
  const dt = parseDate(row[I.DATE]);
  if (!dt) continue;
  const place = (row[I.PLACE] || lastPlace).trim();
  lastPlace = place;
  const dayNotes = [row[I.ITIN], row[I.ACT]].map((s) => (s || "").trim()).filter(Boolean);
  if (!cur || norm(cur.place) !== norm(place)) {
    cur = { place, start: dt, end: dt, notes: [] };
    blocks.push(cur);
  }
  cur.end = dt;
  cur.notes.push(...dayNotes);
}

// stays: one per _DB STAY row, dates derived from its Itinerary place block
const stays = stayRows.map((r) => {
  const ref = g(r, "Ref");
  const bi = blocks.findIndex((b) => norm(b.place) === norm(ref));
  const b = blocks[bi];
  const next = blocks[bi + 1];
  const checkInDt = b ? b.start : null;
  const checkOutDt = next ? next.start : b ? b.end : null;
  const nights = checkInDt && checkOutDt ? Math.round((checkOutDt.num - checkInDt.num) / 864e5) : 0;
  const loc = { name: g(r, "Name"), coords: [Number(g(r, "Lat")) || 0, Number(g(r, "Lng")) || 0], type: "stay" };
  if (g(r, "PlaceQuery")) loc.placeQuery = g(r, "PlaceQuery");
  if (photoMap.get(g(r, "Key"))) loc.photo = photoMap.get(g(r, "Key"));
  return {
    id: g(r, "Key"), name: g(r, "Name"), location: loc,
    checkIn: checkInDt ? mdShort(checkInDt) : "", checkOut: checkOutDt ? mdShort(checkOutDt) : "",
    nights, description: g(r, "Notes"), category: g(r, "Category"), emoji: g(r, "Emoji"),
    _ref: ref,
  };
});

// activities
const activities = actRows.map((r) => {
  const loc = { name: g(r, "Name"), coords: [Number(g(r, "Lat")) || 0, Number(g(r, "Lng")) || 0], type: g(r, "StopType") || "stay" };
  if (g(r, "PlaceQuery")) loc.placeQuery = g(r, "PlaceQuery");
  if (photoMap.get(g(r, "Key"))) loc.photo = photoMap.get(g(r, "Key"));
  const a = { id: g(r, "Key"), name: g(r, "Name"), location: loc, category: g(r, "Category"), emoji: g(r, "Emoji"), _num: parseActDate(g(r, "Date")) };
  if (g(r, "Date")) a.date = g(r, "Date");
  if (g(r, "Notes")) a.notes = g(r, "Notes");
  return a;
});

// ── timeline: one entry per place block ─────────────────────────────────────
const timeline = blocks.map((b) => {
  const stay = stays.find((s) => norm(s._ref) === norm(b.place));
  const dayLegs = legs.filter((l) => l._depNum != null && l._depNum >= b.start.num && l._depNum <= b.end.num);
  const acts = activities.filter((a) => a._num != null && a._num >= b.start.num && a._num <= b.end.num);
  return {
    date: rangeLabel(b.start, b.end, true),
    dateShort: rangeLabel(b.start, b.end, false),
    location: b.place,
    emoji: stay?.emoji || labelEmoji(b.place) || "📍",
    ...(stay ? { stay: strip(stay) } : {}),
    legs: dayLegs.map(strip),
    activities: acts.map(strip),
    ...(b.notes.length ? { notes: b.notes } : {}),
  };
});

// drop internal _fields before serializing
function strip(o) {
  const c = {};
  for (const [k, v] of Object.entries(o)) if (!k.startsWith("_")) c[k] = v;
  return c;
}
const outStays = stays.map(strip);
const outActs = activities.map(strip);
const outLegs = legs.map(strip);

const ts = (name, arr, type) =>
  `export const ${name} = ${JSON.stringify(arr, null, 2)} as unknown as ${type};\n`;
const body =
  `// ⚠ AUTO-GENERATED by scripts/sync-sheet.mjs — do not edit by hand.\n` +
  `// Source of truth: the Google Sheet. Run \`npm run sync\` to regenerate.\n` +
  `import type { Stay, Leg, Activity, TimelineDay } from "./trip";\n\n` +
  ts("stays", outStays, "Stay[]") + "\n" +
  ts("legs", outLegs, "Leg[]") + "\n" +
  ts("activities", outActs, "Activity[]") + "\n" +
  ts("timeline", timeline, "TimelineDay[]");

writeFileSync(OUT, body);
console.log(`✓ Synced from sheet → ${OUT.split("/").slice(-3).join("/")}`);
console.log(`  ${outStays.length} stays · ${outLegs.length} legs (${outLegs.filter((l) => l.status === "booked").length} booked) · ${outActs.length} activities · ${timeline.length} timeline days`);
