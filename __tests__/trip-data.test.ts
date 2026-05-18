import { describe, it, expect } from "vitest";
import { stays, legs, activities, timeline, modeColors, modeIcons } from "../app/data/trip";

describe("trip data integrity", () => {
  it("has 4 stays", () => expect(stays).toHaveLength(4));

  it("every stay has required fields", () => {
    stays.forEach(s => {
      expect(s.id).toBeTruthy();
      expect(s.name).toBeTruthy();
      expect(s.location.coords).toHaveLength(2);
      expect(s.nights).toBeGreaterThan(0);
      expect(s.emoji).toBeTruthy();
    });
  });

  it("every leg has from/to/mode/status", () => {
    legs.forEach(l => {
      expect(l.from).toBeDefined();
      expect(l.to).toBeDefined();
      expect(["flight", "train", "car", "taxi"]).toContain(l.mode);
      expect(["booked", "pending"]).toContain(l.status);
    });
  });

  it("booked legs all have a confirmation number", () => {
    legs.filter(l => l.status === "booked").forEach(l => {
      expect(l.confirmation).toBeTruthy();
    });
  });

  it("activities have valid coords", () => {
    activities.forEach(a => {
      const [lat, lng] = a.location.coords;
      expect(lat).toBeGreaterThan(-90);
      expect(lat).toBeLessThan(90);
      expect(lng).toBeGreaterThan(-180);
      expect(lng).toBeLessThan(180);
    });
  });

  it("timeline covers all legs", () => {
    const timelineLegIds = new Set(timeline.flatMap(d => d.legs.map(l => l.id)));
    // Every leg should appear in exactly one timeline day
    legs.forEach(l => expect(timelineLegIds.has(l.id)).toBe(true));
  });

  it("timeline leg count matches legs array", () => {
    const total = timeline.reduce((sum, d) => sum + d.legs.length, 0);
    expect(total).toBe(legs.length);
  });

  it("modeColors covers all modes used", () => {
    const modes = new Set(legs.map(l => l.mode));
    modes.forEach(m => expect(modeColors[m]).toBeTruthy());
  });

  it("modeIcons covers all modes used", () => {
    const modes = new Set(legs.map(l => l.mode));
    modes.forEach(m => expect(modeIcons[m]).toBeTruthy());
  });

  it("stay coords are within Italy-ish region or nearby (lat 38-47, lng 6-20 except NYC/CDG)", () => {
    const italianStays = stays; // all 4 are Italian
    italianStays.forEach(s => {
      const [lat, lng] = s.location.coords;
      expect(lat).toBeGreaterThan(38);
      expect(lat).toBeLessThan(47);
      expect(lng).toBeGreaterThan(7);
      expect(lng).toBeLessThan(20);
    });
  });
});
