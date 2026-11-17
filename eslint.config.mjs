import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Copy uses natural apostrophes and quotes.
      "react/no-unescaped-entities": "off",
      // Renders are small pre-optimised JPEGs that animate with GSAP; plain <img> is intentional.
      "@next/next/no-img-element": "off",
    },
  },
  { ignores: ["src/lib/motion/**"] },
];

export default config;
