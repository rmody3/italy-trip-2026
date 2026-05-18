import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import PlaceHoverCard from "../app/components/PlaceHoverCard";

vi.useFakeTimers();

describe("PlaceHoverCard", () => {
  it("renders children always", () => {
    render(
      <PlaceHoverCard query="Regina Palace Hotel Stresa" name="Regina Palace Hotel">
        <span>Hover me</span>
      </PlaceHoverCard>
    );
    expect(screen.getByText("Hover me")).toBeInTheDocument();
  });

  it("card is NOT visible initially", () => {
    render(
      <PlaceHoverCard query="test place" name="Test Place">
        <span>Trigger</span>
      </PlaceHoverCard>
    );
    expect(screen.queryByText("See on Google Maps")).not.toBeInTheDocument();
  });

  it("card appears after hover delay", async () => {
    render(
      <PlaceHoverCard query="Regina Palace Hotel Stresa" name="Regina Palace Hotel" subtitle="Stresa, Italy">
        <span>Trigger</span>
      </PlaceHoverCard>
    );
    fireEvent.mouseEnter(screen.getByText("Trigger").parentElement!);
    act(() => { vi.advanceTimersByTime(300); });
    expect(screen.getByText("Regina Palace Hotel")).toBeInTheDocument();
    expect(screen.getByText("Stresa, Italy")).toBeInTheDocument();
  });

  it("card hides after mouse leaves", async () => {
    render(
      <PlaceHoverCard query="test" name="Test">
        <span>Trigger</span>
      </PlaceHoverCard>
    );
    const trigger = screen.getByText("Trigger").parentElement!;
    fireEvent.mouseEnter(trigger);
    act(() => { vi.advanceTimersByTime(300); });
    expect(screen.getByText("Test")).toBeInTheDocument();

    fireEvent.mouseLeave(trigger);
    act(() => { vi.advanceTimersByTime(200); });
    expect(screen.queryByText("Test")).not.toBeInTheDocument();
  });

  it("Google Maps link has correct href", async () => {
    render(
      <PlaceHoverCard query="Regina Palace Hotel Stresa Italy" name="Regina Palace Hotel">
        <span>Trigger</span>
      </PlaceHoverCard>
    );
    fireEvent.mouseEnter(screen.getByText("Trigger").parentElement!);
    act(() => { vi.advanceTimersByTime(300); });
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", expect.stringContaining("google.com/maps"));
    expect(link).toHaveAttribute("href", expect.stringContaining(encodeURIComponent("Regina Palace Hotel Stresa Italy")));
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("does not show card if mouse leaves before delay", async () => {
    render(
      <PlaceHoverCard query="test" name="Test">
        <span>Trigger</span>
      </PlaceHoverCard>
    );
    const trigger = screen.getByText("Trigger").parentElement!;
    fireEvent.mouseEnter(trigger);
    act(() => { vi.advanceTimersByTime(100); }); // less than 300ms
    fireEvent.mouseLeave(trigger);
    act(() => { vi.advanceTimersByTime(300); }); // complete the timer
    expect(screen.queryByText("Test")).not.toBeInTheDocument();
  });
});
