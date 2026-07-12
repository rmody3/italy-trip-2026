"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { timeline, modeColors, modeIcons } from "../data/trip";
import type { Leg, TimelineDay } from "../data/trip";

interface Props {
  onDayHover?: (day: TimelineDay | null) => void;
}

export default function Timeline({ onDayHover }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [open, setOpen] = useState(true);

  const bookedLegs = timeline.flatMap(d => d.legs).filter(l => l.status === "booked").length;
  const totalLegs = timeline.flatMap(d => d.legs).length;

  return (
    <div className="relative h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-base tracking-tight">🇮🇹 Italy 2026</h1>
          <p className="text-white/40 text-xs mt-0.5">Jul 22 – Aug 6 · Rahul & Dhrumi</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-white/60">
            <span className="text-emerald-400 font-semibold">{bookedLegs}</span>
            <span className="text-white/30">/{totalLegs}</span>
          </div>
          <div className="text-white/40 text-[10px]">booked</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-white/5">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(bookedLegs / totalLegs) * 100}%` }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </div>

      {/* Timeline items */}
      <div className="flex-1 overflow-y-auto py-2 scrollbar-hide">
        {timeline.map((day, i) => {
          const isExpanded = expanded === day.dateShort;
          const hasBooked = day.legs.some(l => l.status === "booked");
          const hasActivities = day.activities.length > 0;

          return (
            <motion.div
              key={day.dateShort}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              onMouseEnter={() => onDayHover?.(day)}
              onMouseLeave={() => onDayHover?.(null)}
            >
              {/* Day header */}
              <button
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left group"
                onClick={() => setExpanded(isExpanded ? null : day.dateShort)}
              >
                {/* Timeline dot + line */}
                <div className="flex flex-col items-center flex-shrink-0 w-4">
                  <div
                    className={`w-3 h-3 rounded-full border-2 transition-colors ${
                      hasBooked
                        ? "bg-emerald-500 border-emerald-400"
                        : "bg-transparent border-white/30 group-hover:border-white/50"
                    }`}
                  />
                  {i < timeline.length - 1 && (
                    <div className="w-px flex-1 min-h-4 bg-white/10 mt-1" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{day.emoji}</span>
                    <span className="text-white/80 text-xs font-medium truncate">{day.location}</span>
                  </div>
                  <p className="text-white/30 text-[10px] mt-0.5">{day.date}</p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {day.legs.map(l => (
                    <span
                      key={l.id}
                      className="text-[10px] w-4 h-4 rounded flex items-center justify-center"
                      style={{
                        background: `${modeColors[l.mode]}20`,
                        border: `1px solid ${modeColors[l.mode]}40`,
                      }}
                    >
                      {modeIcons[l.mode]}
                    </span>
                  ))}
                  {hasActivities && (
                    <span className="text-[10px] w-4 h-4 rounded flex items-center justify-center bg-yellow-500/10 border border-yellow-500/30">
                      📍
                    </span>
                  )}
                  <span className={`text-[10px] ml-1 transition-transform ${isExpanded ? "rotate-180" : ""} text-white/30`}>
                    ▾
                  </span>
                </div>
              </button>

              {/* Expanded details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-3 pl-11 space-y-2">
                      {/* Stay card */}
                      {day.stay && (
                        <div
                          className="rounded-lg p-2.5 text-xs"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span>{day.stay.emoji}</span>
                            <span className="text-white font-medium">{day.stay.name}</span>
                          </div>
                          <p className="text-white/50 leading-relaxed">{day.stay.description}</p>
                          <p className="text-white/30 mt-1">{day.stay.checkIn} – {day.stay.checkOut} · {day.stay.nights} nights</p>
                        </div>
                      )}

                      {/* Legs */}
                      {day.legs.map(leg => (
                        <LegCard key={leg.id} leg={leg} />
                      ))}

                      {/* Activities */}
                      {day.activities.map(act => (
                        <div
                          key={act.id}
                          className="rounded-lg p-2 text-xs flex gap-2"
                          style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.15)" }}
                        >
                          <span>{act.emoji}</span>
                          <div>
                            <p className="text-yellow-300/80 font-medium">{act.name}</p>
                            <p className="text-white/40 mt-0.5">{act.notes}</p>
                          </div>
                        </div>
                      ))}

                      {/* Day-by-day plans (from the Itinerary tab) */}
                      {day.notes && day.notes.length > 0 && (
                        <ul className="space-y-1 pt-0.5">
                          {day.notes.map((note, ni) => (
                            <li key={ni} className="text-white/50 text-xs flex gap-1.5 leading-relaxed">
                              <span className="text-white/25 flex-shrink-0">•</span>
                              <span>{note}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/10">
        <p className="text-white/20 text-[10px] text-center">Click a destination on the map for details</p>
      </div>
    </div>
  );
}

function LegCard({ leg }: { leg: Leg }) {
  const color = modeColors[leg.mode];
  const isBooked = leg.status === "booked";

  return (
    <div
      className="rounded-lg p-2.5 text-xs"
      style={{
        background: `${color}10`,
        border: `1px solid ${color}${isBooked ? "50" : "25"}`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span>{modeIcons[leg.mode]}</span>
          <span className="text-white/70 font-medium">
            {leg.from.name.split(",")[0]} → {leg.to.name.split(",")[0]}
          </span>
        </div>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${
            isBooked
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
          }`}
        >
          {isBooked ? "✓ booked" : "pending"}
        </span>
      </div>

      {(leg.departureTime || leg.arrivalTime) && (
        <p className="text-white/40 mt-1">
          {leg.departureTime}
          {leg.arrivalTime ? ` → ${leg.arrivalTime}` : ""}
          {leg.flightNumber ? ` · ${leg.flightNumber}` : ""}
        </p>
      )}

      {leg.confirmation && (
        <p className="mt-1">
          <span className="text-white/30">Conf: </span>
          <span className="text-white/70 font-mono font-medium">{leg.confirmation}</span>
        </p>
      )}

      {leg.price && (
        <p className="text-white/50 mt-0.5">
          <span style={{ color }}>{leg.price}</span>
        </p>
      )}

      {!isBooked && leg.notes && (
        <p className="text-white/30 mt-1 leading-relaxed">{leg.notes}</p>
      )}
    </div>
  );
}
