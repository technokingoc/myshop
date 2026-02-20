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
    const compareAtPrice = product.compareAtPrice ? parseFloat(product.compareAtPrice) : undefined;
    const hasDiscount = compareAtPrice && compareAtPrice > price;
    
    // Enhanced title with pricing info for better CTR
    const titleWithPrice = `${product.name} - ${seller?.currency || store?.currency || "USD"} ${price}${hasDiscount ? ` (was ${compareAtPrice})` : ""} - ${storeName}`;
    
    // Enhanced description with key selling points
    const enhancedDescription = description + (hasDiscount ? ` Save ${Math.round((1 - price / compareAtPrice) * 100)}% off the regular price.` : '') + ` Free delivery available. Shop now at ${storeName}.`;

    return {
      title: titleWithPrice,
      description: enhancedDescription,
      keywords: [
        product.name,
        product.category || "",
        storeName,
        product.type,
        "online store",
        "buy online",
        "e-commerce",
        "Mozambique",
        ...(hasDiscount ? ["discount", "sale", "promotion"] : []),
        ...(product.category ? [product.category.toLowerCase()] : [])
      ].filter(Boolean),
      openGraph: {
        title: titleWithPrice,
        description: enhancedDescription,
        url: productUrl,
        siteName: "MyShop",
        images: images.map((img, index) => ({
          url: img,
          alt: index === 0 ? product.name : `${product.name} - Image ${index + 1}`,
          width: 1200,
          height: 630,
        })),
        type: "product",
        locale: "en_US",
      },
      twitter: {
        card: "summary_large_image",
        site: "@MyShopMZ",
        title: titleWithPrice,
        description: enhancedDescription,
        images: images.length > 0 ? [{
          url: images[0],
          alt: product.name,
        }] : [],
      },
      alternates: {
        canonical: productUrl,
      },
      other: {
        "product:price:amount": price.toString(),
        "product:price:currency": seller?.currency || store?.currency || "USD",
        "product:availability": product.status === "Published" ? "in stock" : "out of stock",
        "product:condition": "new",
        "product:brand": storeName,
        "product:retailer": "MyShop",
        "product:category": product.category || "",
        ...(hasDiscount && {
          "product:sale_price": price.toString(),
          "product:original_price": compareAtPrice.toString(),
        }),
        // Rich snippets for Google
        "og:price:amount": price.toString(),
        "og:price:currency": seller?.currency || store?.currency || "USD",
        "product:retailer_item_id": product.id.toString(),
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