"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import TripPanel from "./components/TripPanel";
import LocationSheet from "./components/LocationSheet";
import type { SelectedPlace } from "./data/trip";

const MapViewGL = dynamic(() => import("./components/MapViewGL"), { ssr: false });

type Theme = "amalfi" | "capri" | "notte";

export default function Home() {
  const [theme, setTheme] = useState<Theme>("amalfi");
  const [selected, setSelected] = useState<SelectedPlace | null>(null);

  // Only mount the map on desktop. On mobile the map is hidden, but if it were
  // still mounted MapLibre would initialize and pull vector tiles over cellular
  // for a map that is never shown — so gate the mount on the viewport.
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <div className={`flex h-[100dvh] w-screen overflow-hidden theme-${theme}`}>

      {/*
        Single TripPanel:
        - Mobile (<md): takes full width, map is not rendered
        - Desktop (md+): 320px sidebar, map fills the rest
      */}
      <div className="w-full md:w-80 flex-shrink-0 h-full overflow-hidden z-10 md:shadow-xl bg-card border-r border-border">
        <TripPanel
          activeTheme={theme}
          onThemeChange={setTheme}
          onLocationSelect={setSelected}
        />
      </div>

      {/* Map — desktop only (not mounted on mobile, so MapLibre never loads there) */}
      <div className="hidden md:flex flex-1 relative h-full min-w-0">
        {isDesktop && <MapViewGL onLocationSelect={setSelected} activeTheme={theme} />}
      </div>

      {/*
        LocationSheet:
        - Mobile: renders as a bottom Sheet portal (no interference with layout)
        - Desktop: renders as a fixed floating card
        Placed outside both panels so it always overlays correctly.
      */}
      <LocationSheet item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
