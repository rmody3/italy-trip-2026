"use client";

import { motion } from "framer-motion";
import { legs } from "../data/trip";

const stats = [
  { label: "Countries", value: "4", sub: "Italy + France" },
  { label: "Nights", value: "15", sub: "Jul 22 – Aug 6" },
  { label: "Regions", value: "4", sub: "Maggiore · Tuscany · Puglia · Sardinia" },
  { label: "Flights", value: "6", sub: `${legs.filter(l => l.mode === "flight" && l.status === "booked").length} booked` },
  { label: "Trains", value: "3", sub: `${legs.filter(l => l.mode === "train" && l.status === "booked").length} booked` },
  { label: "Cars", value: "3", sub: "Florence · Puglia · Sardinia" },
];

export default function StatsBar() {
  return (
    <div className="flex items-center gap-px h-full overflow-x-auto">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 + 0.3 }}
          className="flex-1 min-w-[100px] px-4 h-full flex flex-col justify-center border-r border-white/10 last:border-0"
        >
          <div className="flex items-baseline gap-1.5">
            <span className="text-white font-bold text-lg leading-none">{s.value}</span>
            <span className="text-white/40 text-xs">{s.label}</span>
          </div>
          <p className="text-white/30 text-[10px] mt-0.5 truncate">{s.sub}</p>
        </motion.div>
      ))}
    </div>
  );
}
