import nextVitals from "eslint-config-next/core-web-vitals";

export default [
  {
    ignores: [
      "**/.next/**",
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "playwright-report/**",
      "test-results/**"
    ]
  },
  ...nextVitals
];
