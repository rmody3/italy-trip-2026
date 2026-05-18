"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { timeline, modeIcons, modeColors, legs } from "../data/trip";
import type { Leg, TimelineDay } from "../data/trip";

type Theme = "amalfi" | "capri" | "notte";

const THEMES: { id: Theme; label: string; swatch: string }[] = [
  { id: "amalfi", label: "Amalfi",  swatch: "#C45C3A" },
  { id: "capri",  label: "Capri",   swatch: "#1D6B9E" },
  { id: "notte",  label: "Notte",   swatch: "#2a2a3e" },
];

interface Props {
  activeTheme: Theme;
  onThemeChange: (t: Theme) => void;
}

export default function TripPanel({ activeTheme, onThemeChange }: Props) {
  const [expanded, setExpanded] = useState<string | null>("Jul 22–26");

  const totalLegs = legs.length;
  const bookedLegs = legs.filter(l => l.status === "booked").length;
  const pct = Math.round((bookedLegs / totalLegs) * 100);

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">

      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
          Summer 2026
        </p>
        <h1 className="font-display text-3xl text-foreground leading-tight">
          Italy
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Jul 22 – Aug 6 · Rahul & Dhrumi
        </p>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Bookings</span>
            <span className="font-semibold" style={{ color: "var(--booked-color, #2D6A4F)" }}>
              {bookedLegs}/{totalLegs} confirmed
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "var(--primary)" }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { n: "4", label: "Regions" },
            { n: "15", label: "Nights" },
            { n: "3", label: "Cars" },
          ].map(s => (
            <div key={s.label} className="text-center py-2 rounded-lg bg-muted/60">
              <p className="text-base font-bold text-foreground">{s.n}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* ── Timeline ── */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-3 py-3 space-y-1">
          {timeline.map((day, i) => (
            <DayRow
              key={day.dateShort}
              day={day}
              index={i}
              isExpanded={expanded === day.dateShort}
              isLast={i === timeline.length - 1}
              onToggle={() => setExpanded(expanded === day.dateShort ? null : day.dateShort)}
            />
          ))}
        </div>
      </ScrollArea>

      <Separator />

      {/* ── Theme switcher ── */}
      <div className="px-5 py-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Theme</p>
        <div className="flex gap-2">
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => onThemeChange(t.id)}
              className={`flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                activeTheme === t.id
                  ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/8"
                  : "border-border text-muted-foreground hover:border-foreground/30"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: t.swatch }}
              />
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DayRow({
  day, index, isExpanded, isLast, onToggle,
}: {
  day: TimelineDay;
  index: number;
  isExpanded: boolean;
  isLast: boolean;
  onToggle: () => void;
}) {
  const hasBooked = day.legs.some(l => l.status === "booked");

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      {/* Row header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-muted/70 transition-colors group text-left"
      >
        {/* Timeline dot */}
        <div className="relative flex-shrink-0 w-5 flex flex-col items-center">
          <div
            className="w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] flex-shrink-0"
            style={hasBooked
              ? { background: "var(--booked-color, #2D6A4F)", borderColor: "var(--booked-color, #2D6A4F)", color: "white" }
              : { background: "transparent", borderColor: "var(--border)" }
            }
          >
            {hasBooked && "✓"}
          </div>
          {!isLast && (
            <div
              className="w-px mt-1 mb-0"
              style={{ height: 28, background: "var(--border)" }}
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-base leading-none">{day.emoji}</span>
            <span className="text-sm font-medium text-foreground truncate">{day.location}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">{day.date}</p>
        </div>

        {/* Mode chips */}
        <div className="flex gap-1 items-center flex-shrink-0">
          {day.legs.map(l => (
            <span
              key={l.id}
              className="text-[10px] px-1 py-0.5 rounded-md"
              style={{
                background: `${modeColors[l.mode]}18`,
                color: modeColors[l.mode],
              }}
            >
              {modeIcons[l.mode]}
            </span>
          ))}
          <span className={`text-muted-foreground text-[11px] ml-0.5 transition-transform inline-block ${isExpanded ? "rotate-180" : ""}`}>
            ›
          </span>
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pl-10 pr-2 pb-2 space-y-2">
              {/* Stay info */}
              {day.stay && (
                <div className="rounded-xl p-3 bg-muted/50 border border-border/60">
                  <p className="text-sm font-semibold text-foreground">{day.stay.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{day.stay.description}</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-1.5">
                    {day.stay.checkIn} – {day.stay.checkOut} · {day.stay.nights} nights
                  </p>
                </div>
              )}

              {/* Legs */}
              {day.legs.map(leg => (
                <LegRow key={leg.id} leg={leg} />
              ))}

              {/* Activities */}
              {day.activities.map(act => (
                <div
                  key={act.id}
                  className="rounded-xl p-3 border flex gap-2.5"
                  style={{
                    background: "oklch(0.97 0.02 85 / 0.5)",
                    borderColor: "oklch(0.85 0.04 80)",
                  }}
                >
                  <span className="text-xl leading-none mt-0.5">{act.emoji}</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{act.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{act.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function LegRow({ leg }: { leg: Leg }) {
  const isBooked = leg.status === "booked";
  const color = modeColors[leg.mode];

  return (
    <div
      className="rounded-xl p-3 border"
      style={{
        background: `${color}0d`,
        borderColor: `${color}${isBooked ? "35" : "20"}`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base flex-shrink-0">{modeIcons[leg.mode]}</span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground leading-tight truncate">
              {leg.from.name.split(",")[0]} → {leg.to.name.split(",")[0]}
            </p>
            {(leg.departureTime || leg.flightNumber) && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {[leg.departureTime, leg.arrivalTime].filter(Boolean).join(" → ")}
                {leg.flightNumber ? ` · ${leg.flightNumber}` : ""}
              </p>
            )}
          </div>
        </div>
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0.5 flex-shrink-0 border ${
            isBooked
              ? "border-emerald-500/40 text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20"
              : "border-amber-500/40 text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20"
          }`}
        >
          {isBooked ? "✓" : "·"} {isBooked ? "booked" : "pending"}
        </Badge>
      </div>

      {isBooked && leg.confirmation && (
        <p className="text-[11px] mt-1.5 font-mono">
          <span className="text-muted-foreground">Conf </span>
          <span className="font-bold tracking-wide" style={{ color }}>{leg.confirmation}</span>
          {leg.price && <span className="text-muted-foreground ml-2 font-sans font-normal">{leg.price}</span>}
        </p>
      )}

      {!isBooked && leg.notes && (
        <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{leg.notes}</p>
      )}
    </div>
  );
}
