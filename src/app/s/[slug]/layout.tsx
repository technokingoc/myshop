import { Metadata } from "next";
import { getDb } from "@/lib/db";
import { sellers } from "@/lib/schema";
import { eq } from "drizzle-orm";

type Props = { params: Promise<{ slug: string }>; children: React.ReactNode };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const db = getDb();
    const [seller] = await db.select().from(sellers).where(eq(sellers.slug, slug));
    if (!seller) {
      return { title: "Store Not Found" };
    }
    const title = `${seller.name} — ${seller.description?.slice(0, 100) || "Online Store"} | MyShop`;
    const description = seller.description || `Shop at ${seller.name} on MyShop`;
    return {
      title: seller.name,
      description,
      openGraph: {
        title,
        description,
        images: seller.bannerUrl ? [{ url: seller.bannerUrl, width: 1200, height: 630 }] : undefined,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: seller.name,
        description,
        images: seller.bannerUrl ? [seller.bannerUrl] : undefined,
      },
    };
  } catch {
    return { title: "Store" };
  }
}

export default function StorefrontLayout({ children }: Props) {
  return <>{children}</>;
}
