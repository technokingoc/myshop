import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { catalogItems, sellers, stores } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getCustomerSession } from "@/lib/customer-session";
import ProductReviewsPage from "./reviews-page";

interface Props {
  params: Promise<{ id: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  try {
    const db = getDb();
    const productId = parseInt(id);
    
    if (isNaN(productId)) {
      return {
        title: "Product Reviews - MyShop",
        description: "Read customer reviews and ratings",
      };
    }

    const [result] = await db
      .select({
        product: catalogItems,
        seller: sellers,
        store: stores,
      })
      .from(catalogItems)
      .leftJoin(sellers, eq(catalogItems.sellerId, sellers.id))
      .leftJoin(stores, eq(catalogItems.sellerId, stores.userId))
      .where(eq(catalogItems.id, productId));

    if (!result) {
      return {
        title: "Product Reviews - MyShop",
        description: "Product not found",
      };
    }

    const { product, seller, store } = result;
    const storeName = store?.name || seller?.name || "Store";
    
    return {
      title: `${product.name} Reviews & Ratings - ${storeName}`,
      description: `Read customer reviews and ratings for ${product.name}. See what other customers think about this product.`,
      keywords: [
        product.name,
        "reviews",
        "ratings", 
        "customer feedback",
        storeName,
        "product reviews",
        "customer opinions"
      ],
      openGraph: {
        title: `${product.name} Reviews`,
        description: `Customer reviews and ratings for ${product.name}`,
        images: product.imageUrl ? [product.imageUrl] : [],
        type: "website",
      },
    };
  } catch (error) {
    console.error("Error generating reviews metadata:", error);
    return {
      title: "Product Reviews - MyShop", 
      description: "Customer reviews and ratings",
    };
  }
}

export default async function ProductReviewsRoute({ params }: Props) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  try {
    const db = getDb();
    const productId = parseInt(id);
    
    if (isNaN(productId)) {
      notFound();
    }

    // Get product with store/seller info
    const [productData] = await db
      .select({
        product: catalogItems,
        seller: sellers,
        store: stores,
      })
      .from(catalogItems)
      .leftJoin(sellers, eq(catalogItems.sellerId, sellers.id))
      .leftJoin(stores, eq(catalogItems.sellerId, stores.userId))
      .where(eq(catalogItems.id, productId));

    if (!productData) {
      notFound();
    }

    const { product, seller, store } = productData;

    // Get customer session
    const customer = await getCustomerSession();

    return (
      <ProductReviewsPage 
        product={product}
        seller={seller}
        store={store}
        customer={customer}
      />
    );
  } catch (error) {
    console.error("Error loading product reviews page:", error);
    notFound();
  }
}