"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import TripPanel from "./components/TripPanel";
import LocationSheet from "./components/LocationSheet";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { Stay, Activity } from "./data/trip";
import { legs } from "./data/trip";

const MapView = dynamic(() => import("./components/MapView"), { ssr: false });

type Theme = "amalfi" | "capri" | "notte";

export default function Home() {
  const [theme, setTheme] = useState<Theme>("amalfi");
  const [selected, setSelected] = useState<Stay | Activity | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const bookedCount = legs.filter(l => l.status === "booked").length;

  return (
    <div className={`flex h-[100dvh] w-screen overflow-hidden theme-${theme}`}>

      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <div className="hidden md:flex w-80 flex-shrink-0 h-full overflow-hidden z-10 shadow-xl">
        <TripPanel activeTheme={theme} onThemeChange={setTheme} />
      </div>

      {/* ── Map (fills screen on mobile, fills remaining space on desktop) ── */}
      <div className="flex-1 relative h-full min-w-0">
        <MapView onLocationSelect={setSelected} activeTheme={theme} />
        <LocationSheet item={selected} onClose={() => setSelected(null)} />

        {/* ── Mobile bottom bar ── */}
        <div className="md:hidden absolute bottom-0 left-0 right-0 z-30">
          <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
            <SheetTrigger
              className="w-full flex items-center justify-between px-5 py-3.5 bg-card border-t border-border shadow-xl"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🇮🇹</span>
                <div className="text-left">
                  <p className="font-semibold text-sm text-foreground leading-tight">Italy 2026</p>
                  <p className="text-xs text-muted-foreground">Jul 22 – Aug 6 · Rahul & Dhrumi</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {bookedCount} booked
                </span>
                <span className="text-muted-foreground text-sm">↑</span>
              </div>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="h-[80dvh] p-0 rounded-t-2xl overflow-hidden"
            >
              <TripPanel activeTheme={theme} onThemeChange={setTheme} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
