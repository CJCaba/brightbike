import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Engine + AI: pure, deterministic TypeScript (runs in tests, browser, or a future server)
    files: ["src/engine/**/*.{ts,tsx}", "src/ai/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          regex: "^(react|react-dom|next)(/|$)|(^|/)(components|render|controllers|app)(/|$)",
          message: "The engine and AI must stay pure TypeScript (no React/Next/UI imports).",
        }],
      }],
      "no-restricted-globals": ["error", "window", "document", "requestAnimationFrame", "performance"],
      "no-restricted-properties": ["error",
        {
          object: "Math", property: "random",
          message: "Engine and AI must be deterministic — use a seeded PRNG (src/ai/rng.ts).",
        },
        {
          object: "Date", property: "now",
          message: "Engine and AI must be deterministic — time comes from the tick counter.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
