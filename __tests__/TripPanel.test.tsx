import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TripPanel from "../app/components/TripPanel";
import { legs } from "../app/data/trip";

const noop = vi.fn();

describe("TripPanel", () => {
  it("renders the trip title", () => {
    render(<TripPanel activeTheme="amalfi" onThemeChange={noop} />);
    expect(screen.getByText("Italy")).toBeInTheDocument();
  });

  it("renders dates and traveler names", () => {
    render(<TripPanel activeTheme="amalfi" onThemeChange={noop} />);
    expect(screen.getByText(/Rahul & Dhrumi/)).toBeInTheDocument();
    // The header subtitle contains the full date range
    expect(screen.getByText(/Jul 22 – Aug 6/)).toBeInTheDocument();
  });

  it("shows correct booked count", () => {
    render(<TripPanel activeTheme="amalfi" onThemeChange={noop} />);
    const booked = legs.filter(l => l.status === "booked").length;
    expect(screen.getByText(new RegExp(`${booked}/${legs.length} confirmed`))).toBeInTheDocument();
  });

  it("renders all timeline days", () => {
    render(<TripPanel activeTheme="amalfi" onThemeChange={noop} />);
    expect(screen.getByText("NYC → Milan")).toBeInTheDocument();
    expect(screen.getByText("Lake Maggiore")).toBeInTheDocument();
    // "Tuscany" appears in multiple rows; check for the standalone one
    expect(screen.getAllByText(/Tuscany/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Puglia")).toBeInTheDocument();
    expect(screen.getByText("Sardinia")).toBeInTheDocument();
  });

  it("renders theme switcher buttons", () => {
    render(<TripPanel activeTheme="amalfi" onThemeChange={noop} />);
    expect(screen.getByText("Amalfi")).toBeInTheDocument();
    expect(screen.getByText("Capri")).toBeInTheDocument();
    expect(screen.getByText("Notte")).toBeInTheDocument();
  });

  it("calls onThemeChange when theme button clicked", () => {
    const onThemeChange = vi.fn();
    render(<TripPanel activeTheme="amalfi" onThemeChange={onThemeChange} />);
    fireEvent.click(screen.getByText("Capri"));
    expect(onThemeChange).toHaveBeenCalledWith("capri");
  });

  it("expands a day on click to show legs", () => {
    render(<TripPanel activeTheme="amalfi" onThemeChange={noop} />);
    // One day is expanded by default (Jul 22–26)
    // Click on "CAG → Paris → NYC" to expand it
    const row = screen.getByText(/CAG → Paris → NYC/);
    fireEvent.click(row.closest("button")!);
    // Should show the Air France leg
    expect(screen.getByText(/AF1111/)).toBeInTheDocument();
  });

  it("shows booked badge for confirmed legs after expand", () => {
    render(<TripPanel activeTheme="amalfi" onThemeChange={noop} />);
    // Expand the Milan → Florence day (has booked Italo train)
    const row = screen.getByText(/Milan → Florence → Tuscany/);
    fireEvent.click(row.closest("button")!);
    expect(screen.getByText(/CCDUHP/)).toBeInTheDocument();
  });
});
