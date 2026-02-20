import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://myshop.co.mz";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/s/", "/stores", "/pricing", "/register", "/login", "/customer/register", "/open-store"],
        disallow: [
          "/dashboard/", 
          "/api/", 
          "/admin/", 
          "/setup",
          "/customer/",
          "/cart",
          "/checkout",
          "/track/",
          "/_next/",
          "/favicon.ico",
        ],
        crawlDelay: 1,
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/s/", "/stores", "/pricing", "/register", "/open-store"],
        disallow: [
          "/dashboard/", 
          "/api/", 
          "/admin/", 
          "/setup",
          "/customer/",
          "/cart",
          "/checkout",
          "/track/",
        ],
      },
      {
        userAgent: "Bingbot",
        allow: ["/", "/s/", "/stores", "/pricing"],
        disallow: [
          "/dashboard/", 
          "/api/", 
          "/admin/", 
          "/setup",
          "/customer/",
          "/cart",
          "/checkout",
        ],
        crawlDelay: 2,
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
