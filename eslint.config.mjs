import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: ["src/__tests__/**/*"],
    rules: {
      // Prevent console statements in production
      "no-console": ["error", { "allow": ["warn", "error"] }],
      
      // Improve code quality
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      
      // Prevent common issues
      "no-debugger": "error",
      "no-alert": "error",
      
      // Best practices
      "prefer-const": "error",
      "no-var": "error",
    }
  }
];

export default eslintConfig;
