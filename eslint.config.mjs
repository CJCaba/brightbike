import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/engine/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          regex: "^(react|react-dom|next)(/|$)|(^|/)(components|render|controllers|app)(/|$)",
          message: "The engine must stay pure TypeScript (no React/Next/UI imports).",
        }],
      }],
      "no-restricted-globals": ["error", "window", "document", "requestAnimationFrame", "performance"],
      "no-restricted-properties": ["error",
        {
          object: "Math", property: "random",
          message: "Engine must be deterministic — use a seeded PRNG stored in state.",
        },
        {
          object: "Date", property: "now",
          message: "Engine must be deterministic — time comes from the tick counter.",
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
