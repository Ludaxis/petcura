import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // jsdom is required for React hooks (useEffect/useState in DelayedFallback)
    // and for the matchMedia stub used by the prefers-reduced-motion case.
    environment: "jsdom",
    globals: false,
    include: ["src/**/*.test.{ts,tsx}"]
  }
});
