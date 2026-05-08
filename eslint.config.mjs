import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Worktree build artifacts and generated Prisma client — never lint these.
    "**/.next/**",
    "**/.claude/**",
    "generated/**",
    // Standalone debug script with pre-existing issues; fix or remove separately.
    "test-flow.ts",
  ]),
]);

export default eslintConfig;
