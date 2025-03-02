import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  {
    rules: {
      "prettier/prettier": "error",
      "arrow-body-style": ["error", "as-needed"],
      "prefer-arrow-callback": "error",
    },
    plugins: ["prettier"],
  },
];

export default eslintConfig;
