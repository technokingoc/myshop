import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { catalogItems, sellers, stores, comments, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import ProductPage from "./product-page";

interface Props {
  params: Promise<{ slug: string; id: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const { slug, id } = resolvedParams;
  
  try {
    const db = getDb();
    const productId = parseInt(id);
    
    // Get product with store/seller info
    const [result] = await db
      .select({
        product: catalogItems,
        seller: sellers,
        store: stores,
      })
      .from(catalogItems)
      .leftJoin(sellers, eq(catalogItems.sellerId, sellers.id))
      .leftJoin(stores, eq(catalogItems.sellerId, stores.userId))
      .where(
        and(
          eq(catalogItems.id, productId),
          eq(catalogItems.status, "Published")
        )
      );

    if (!result) {
      return {
        title: "Product Not Found",
        description: "This product could not be found.",
      };
    }

    const { product, seller, store } = result;
    const storeName = store?.name || seller?.name || "Store";
    const storeSlug = store?.slug || seller?.slug || "";
    
    // Verify the slug matches
    if (storeSlug !== slug) {
      return {
        title: "Product Not Found",
        description: "This product could not be found.",
      };
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://myshop.co.mz";
    const productUrl = `${baseUrl}/s/${slug}/product/${id}`;
    const images = product.imageUrl ? [product.imageUrl] : [];
    
    // If there are multiple images, add them
    if (product.imageUrls) {
      try {
        const additionalImages = JSON.parse(product.imageUrls);
        if (Array.isArray(additionalImages)) {
          images.push(...additionalImages);
        }
      } catch {
        // Ignore parsing errors
      }
    }

    const description = product.shortDescription || `${product.name} from ${storeName}`;
    const price = parseFloat(product.price) || 0;

    return {
      title: `${product.name} - ${storeName}`,
      description,
      keywords: [
        product.name,
        product.category || "",
        storeName,
        product.type,
        "online store",
        "buy online"
      ].filter(Boolean),
      openGraph: {
        title: `${product.name} - ${storeName}`,
        description,
        url: productUrl,
        siteName: "MyShop",
        images: images.map(img => ({
          url: img,
          alt: product.name,
        })),
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${product.name} - ${storeName}`,
        description,
        images: images.length > 0 ? [images[0]] : [],
      },
      alternates: {
        canonical: productUrl,
      },
      other: {
        "product:price:amount": price.toString(),
        "product:price:currency": seller?.currency || store?.currency || "USD",
        "product:availability": "in stock",
        "product:brand": storeName,
      },
    };
  } catch (error) {
    console.error("Error generating product metadata:", error);
    return {
      title: "Product",
      description: "Product details",
    };
  }
}

export default async function ProductPageRoute({ params }: Props) {
  const resolvedParams = await params;
  const { slug, id } = resolvedParams;
  
  try {
    const db = getDb();
    const productId = parseInt(id);
    
    // Get product with store/seller info and reviews
    const [productData] = await db
      .select({
        product: catalogItems,
        seller: sellers,
        store: stores,
      })
      .from(catalogItems)
      .leftJoin(sellers, eq(catalogItems.sellerId, sellers.id))
      .leftJoin(stores, eq(catalogItems.sellerId, stores.userId))
      .where(
        and(
          eq(catalogItems.id, productId),
          eq(catalogItems.status, "Published")
        )
      );

    if (!productData) {
      notFound();
    }

    const { product, seller, store } = productData;
    const storeSlug = store?.slug || seller?.slug || "";
    
    // Verify the slug matches
    if (storeSlug !== slug) {
      notFound();
    }

    // Get product reviews
    const reviews = await db
      .select()
      .from(comments)
      .where(eq(comments.catalogItemId, productId))
      .orderBy(comments.createdAt);

    return (
      <ProductPage 
        product={product}
        seller={seller}
        store={store}
        reviews={reviews}
        slug={slug}
      />
    );
  } catch (error) {
    console.error("Error loading product page:", error);
    notFound();
  }
}