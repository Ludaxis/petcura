import nextVitals from "eslint-config-next/core-web-vitals";

export default [
  {
    ignores: [
      "**/.next/**",
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "playwright-report/**",
      "test-results/**",
      // Static handoff prototypes — vanilla React-via-Babel-standalone, not
      // production source. Linted patterns differ; served as-is from /public.
      "apps/web/public/prototypes/**"
    ]
  },
  ...nextVitals
];
