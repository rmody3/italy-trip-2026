import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LocationSheet from "../app/components/LocationSheet";
import { stays, activities } from "../app/data/trip";

const stayItem = stays[0]; // Regina Palace Hotel
const activityItem = activities[0]; // Borromean Islands

describe("LocationSheet", () => {
  it("renders nothing when item is null", () => {
    const { container } = render(<LocationSheet item={null} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders stay name and details", () => {
    render(<LocationSheet item={stayItem} onClose={vi.fn()} />);
    expect(screen.getByText(stayItem.name)).toBeInTheDocument();
    expect(screen.getByText(stayItem.description)).toBeInTheDocument();
  });

  it("renders stay dates", () => {
    render(<LocationSheet item={stayItem} onClose={vi.fn()} />);
    expect(screen.getByText(new RegExp(stayItem.checkIn))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(stayItem.checkOut))).toBeInTheDocument();
  });

  it("renders activity name and notes", () => {
    render(<LocationSheet item={activityItem} onClose={vi.fn()} />);
    expect(screen.getByText(activityItem.name)).toBeInTheDocument();
    expect(screen.getByText(activityItem.notes!)).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(<LocationSheet item={stayItem} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "✕" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders a Google Maps link", () => {
    render(<LocationSheet item={stayItem} onClose={vi.fn()} />);
    const link = screen.getByRole("link", { name: /open in google maps/i });
    expect(link).toHaveAttribute("href", expect.stringContaining("google.com/maps"));
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("Google Maps link includes location query", () => {
    render(<LocationSheet item={stayItem} onClose={vi.fn()} />);
    const link = screen.getByRole("link", { name: /open in google maps/i });
    const href = link.getAttribute("href") ?? "";
    const encoded = encodeURIComponent(stayItem.location.placeQuery ?? stayItem.name);
    expect(href).toContain(encoded);
  });

  it("renders an iframe embed", () => {
    render(<LocationSheet item={stayItem} onClose={vi.fn()} />);
    const iframe = document.querySelector("iframe");
    expect(iframe).toBeTruthy();
    expect(iframe?.src).toContain("maps.google.com");
  });
});
