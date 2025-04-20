import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "/",
      lastModified: new Date("2025-04-18T04:51:25.753Z"),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "/blog",
      lastModified: new Date("2025-04-18T04:51:25.753Z"),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "blog/2025-4-W15",
      lastModified: new Date("2025-04-14T00:00:00.000Z"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "blog/health-care-live",
      lastModified: new Date("2025-04-17T00:00:00.000Z"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
