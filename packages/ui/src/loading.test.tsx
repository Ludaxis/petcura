// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  DelayedFallback,
  Shimmer,
  SkeletonList,
  Spinner
} from "./loading";

/*
 * Minimal render helper. We don't pull in @testing-library/react here —
 * the suite is small enough to wire up createRoot + act directly, and
 * adding a testing-library dep would balloon node_modules for one file.
 *
 * Each `render` call returns the host container plus an `unmount` cleanup
 * that the afterEach hook calls automatically.
 */
type Rendered = { container: HTMLDivElement; root: Root };
let mounted: Array<Rendered> = [];

function render(ui: React.ReactElement): Rendered {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  const rendered = { container, root };
  mounted.push(rendered);
  return rendered;
}

afterEach(() => {
  for (const { root, container } of mounted) {
    act(() => {
      root.unmount();
    });
    container.remove();
  }
  mounted = [];
});

describe("Shimmer", () => {
  it("renders a .pc-shimmer element by default", () => {
    const { container } = render(<Shimmer />);
    const el = container.querySelector(".pc-shimmer");
    expect(el).not.toBeNull();
    // Defaults: span tag, aria-hidden="true".
    expect(el?.tagName).toBe("SPAN");
    expect(el?.getAttribute("aria-hidden")).toBe("true");
  });

  it("respects the slow prop by adding pc-shimmer-slow", () => {
    const { container } = render(<Shimmer slow />);
    const el = container.querySelector(".pc-shimmer");
    expect(el?.classList.contains("pc-shimmer-slow")).toBe(true);
  });

  it("honors ariaHidden=false (drops the attribute)", () => {
    const { container } = render(<Shimmer ariaHidden={false} />);
    const el = container.querySelector(".pc-shimmer");
    expect(el).not.toBeNull();
    expect(el?.hasAttribute("aria-hidden")).toBe(false);
  });

  it("still renders .pc-shimmer under prefers-reduced-motion (CSS handles the fallback)", () => {
    // Stub matchMedia so the component renders under the reduced-motion
    // preference. The pc-shimmer class itself stays in the markup —
    // globals.css turns the animation off via @media query, so verifying
    // the class is present is the correct contract to assert.
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("prefers-reduced-motion: reduce"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    })) as unknown as typeof window.matchMedia;
    try {
      const { container } = render(<Shimmer />);
      const el = container.querySelector(".pc-shimmer");
      expect(el).not.toBeNull();
      // The animation class is the load-bearing assertion — CSS does the
      // animation-none fallback when @media (prefers-reduced-motion: reduce).
      expect(el?.classList.contains("pc-shimmer")).toBe(true);
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });
});

describe("Spinner", () => {
  it("renders role=status with the supplied aria-label", () => {
    const { container } = render(<Spinner label="Saving reminder" />);
    const status = container.querySelector('[role="status"]');
    expect(status).not.toBeNull();
    expect(status?.getAttribute("aria-label")).toBe("Saving reminder");
  });

  it("falls back to 'Loading' when no label is provided", () => {
    const { container } = render(<Spinner />);
    const status = container.querySelector('[role="status"]');
    expect(status?.getAttribute("aria-label")).toBe("Loading");
  });
});

describe("DelayedFallback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders null before the delay and children after", () => {
    const { container } = render(
      <DelayedFallback delay={200}>
        <span data-testid="delayed">visible</span>
      </DelayedFallback>
    );
    // Before the delay elapses, children are not in the DOM.
    expect(container.querySelector('[data-testid="delayed"]')).toBeNull();

    // Advance through the delay; the effect runs and flips state.
    act(() => {
      vi.advanceTimersByTime(200);
    });
    const child = container.querySelector('[data-testid="delayed"]');
    expect(child).not.toBeNull();
    expect(child?.textContent).toBe("visible");
  });

  it("renders children immediately when delay=0", () => {
    const { container } = render(
      <DelayedFallback delay={0}>
        <span data-testid="immediate">now</span>
      </DelayedFallback>
    );
    expect(container.querySelector('[data-testid="immediate"]')).not.toBeNull();
  });
});

describe("SkeletonList", () => {
  it("honors the rows prop and renders aria-busy on the <ul>", () => {
    const { container } = render(
      <SkeletonList rows={5} label="Loading inbox" />
    );
    const ul = container.querySelector("ul");
    expect(ul).not.toBeNull();
    expect(ul?.getAttribute("aria-busy")).toBe("true");
    expect(ul?.getAttribute("aria-label")).toBe("Loading inbox");
    expect(ul?.querySelectorAll("li").length).toBe(5);
  });

  it("uses a default label when none is provided", () => {
    const { container } = render(<SkeletonList rows={2} />);
    const ul = container.querySelector("ul");
    expect(ul?.getAttribute("aria-label")).toBe("Loading list");
    expect(ul?.querySelectorAll("li").length).toBe(2);
  });
});
