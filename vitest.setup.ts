import "@testing-library/jest-dom";

// Stub Leaflet — it manipulates the DOM directly and doesn't work in jsdom
vi.mock("leaflet", () => ({
  default: {
    map: vi.fn(() => ({
      setView: vi.fn().mockReturnThis(),
      addLayer: vi.fn(),
      on: vi.fn(),
      remove: vi.fn(),
    })),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    polyline: vi.fn(() => ({ addTo: vi.fn() })),
    marker: vi.fn(() => ({ on: vi.fn(), addTo: vi.fn() })),
    divIcon: vi.fn(() => ({})),
    DomEvent: { stopPropagation: vi.fn() },
    control: { zoom: vi.fn(() => ({ addTo: vi.fn() })) },
    Icon: { Default: { prototype: {}, mergeOptions: vi.fn() } },
  },
}));

// Stub framer-motion so it renders children without animation
vi.mock("framer-motion", async () => {
  const React = await import("react");
  const motion = new Proxy(
    {},
    {
      get: (_t, tag: string) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        React.forwardRef(({ children, ...props }: any, ref: any) =>
          React.createElement(tag, { ...props, ref }, children)
        ),
    }
  );
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});
