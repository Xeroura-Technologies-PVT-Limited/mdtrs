import type { MetadataRoute } from "next";
import { SITE, TREATMENTS } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const paths = ["", "/treatments", ...TREATMENTS.map((t) => `/treatments/${t.slug}`), "/about", "/contact", "/faq", "/privacy"];
  return paths.map((p) => ({ url: `${SITE.url}${p}`, lastModified: now, changeFrequency: "monthly", priority: p === "" ? 1 : 0.7 }));
}
