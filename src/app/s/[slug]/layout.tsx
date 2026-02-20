import { Metadata } from "next";
import { getDb } from "@/lib/db";
import { sellers, stores, users } from "@/lib/schema";
import { eq } from "drizzle-orm";

type Props = { params: Promise<{ slug: string }>; children: React.ReactNode };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const db = getDb();
    
    // Try new stores table first
    let storeData = await db
      .select({
        name: stores.name,
        description: stores.description,
        logoUrl: stores.logoUrl,
        bannerUrl: stores.bannerUrl,
        city: stores.city,
        country: stores.country,
        currency: stores.currency,
        createdAt: stores.createdAt,
        businessType: stores.businessType,
        socialLinks: stores.socialLinks,
      })
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);
    
    // Fallback to legacy sellers table
    if (storeData.length === 0) {
      const sellerData = await db
        .select({
          name: sellers.name,
          description: sellers.description,
          logoUrl: sellers.logoUrl,
          bannerUrl: sellers.bannerUrl,
          city: sellers.city,
          country: sellers.country,
          currency: sellers.currency,
          createdAt: sellers.createdAt,
          businessType: sellers.businessType,
          socialLinks: sellers.socialLinks,
        })
        .from(sellers)
        .where(eq(sellers.slug, slug))
        .limit(1);
      
      storeData = sellerData;
    }
    
    if (storeData.length === 0) {
      return { 
        title: "Store Not Found",
        description: "This store could not be found.",
      };
    }
    
    const store = storeData[0];
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://myshop.co.mz";
    const storeUrl = `${baseUrl}/s/${slug}`;
    
    const title = `${store.name} — ${store.description?.slice(0, 80) || "Online Store"} | MyShop`;
    const locationStr = [store.city, store.country].filter(Boolean).join(', ');
    const description = store.description || `Shop at ${store.name} on MyShop. ${store.businessType || "Retail"} store${locationStr ? ` located in ${locationStr}` : ''}. Fast delivery, secure payments, quality products.`;
    
    const keywords = [
      store.name,
      store.businessType || "retail",
      store.city,
      store.country,
      "online store",
      "buy online", 
      "e-commerce",
      "MyShop",
      "Mozambique",
      "shopping",
      "delivery",
      ...(store.businessType?.toLowerCase().includes('food') || store.businessType?.toLowerCase().includes('restaurant') 
        ? ["food delivery", "restaurant", "takeaway"] 
        : []),
      ...(store.businessType?.toLowerCase().includes('service') 
        ? ["services", "professional services"] 
        : [])
    ].filter((k): k is string => Boolean(k) && typeof k === 'string');

    return {
      title: store.name,
      description,
      keywords,
      openGraph: {
        title,
        description,
        url: storeUrl,
        siteName: "MyShop",
        images: store.bannerUrl ? [{
          url: store.bannerUrl,
          width: 1200,
          height: 630,
          alt: `${store.name} - ${store.businessType || 'Store'} in ${locationStr || 'Mozambique'}`
        }] : (store.logoUrl ? [{
          url: store.logoUrl,
          width: 400,
          height: 400,
          alt: `${store.name} logo`
        }] : undefined),
        type: "website",
        locale: "en_US",
      },
      twitter: {
        card: "summary_large_image",
        site: "@MyShopMZ",
        title,
        description,
        images: store.bannerUrl ? [{
          url: store.bannerUrl,
          alt: `${store.name} banner`
        }] : (store.logoUrl ? [{
          url: store.logoUrl,
          alt: `${store.name} logo`
        }] : undefined),
      },
      alternates: {
        canonical: storeUrl,
      },
      other: {
        "business:contact_data:locality": store.city || "",
        "business:contact_data:country_name": store.country || "",
        "business:contact_data:business_type": store.businessType || "Retail",
        "og:locality": store.city || "",
        "og:country-name": store.country || "",
        "business:hours": "24/7", // Can be enhanced with actual business hours
        "business:contact_data:phone_number": "", // Can be enhanced with actual phone
        "place:location:latitude": "", // Can be enhanced with actual coordinates
        "place:location:longitude": "",
      },
    };
  } catch (error) {
    console.error("Error generating store metadata:", error);
    return { 
      title: "Store",
      description: "Online store on MyShop",
    };
  }
}

export default function StorefrontLayout({ children }: Props) {
  return <>{children}</>;
}
