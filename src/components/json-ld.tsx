"use client";

export function StoreJsonLd({
  name,
  description,
  url,
  logo,
  image,
  address,
  city,
  country,
  telephone,
  email,
  socialLinks,
}: {
  name: string;
  description: string;
  url: string;
  logo?: string;
  image?: string;
  address?: string;
  city?: string;
  country?: string;
  telephone?: string;
  email?: string;
  socialLinks?: { whatsapp?: string; instagram?: string; facebook?: string };
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    description,
    url,
    ...(logo && { logo }),
    ...(image && { image }),
    ...(telephone && { telephone }),
    ...(email && { email }),
    ...((address || city) && {
      address: {
        "@type": "PostalAddress",
        ...(address && { streetAddress: address }),
        ...(city && { addressLocality: city }),
        ...(country && { addressCountry: country }),
      },
    }),
    ...(socialLinks && {
      sameAs: [
        socialLinks.whatsapp && `https://wa.me/${socialLinks.whatsapp}`,
        socialLinks.instagram && `https://instagram.com/${socialLinks.instagram}`,
        socialLinks.facebook && `https://facebook.com/${socialLinks.facebook}`,
      ].filter(Boolean),
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function ProductJsonLd({
  name,
  description,
  image,
  images,
  price,
  currency,
  url,
  seller,
  category,
  sku,
  availability = "InStock",
  condition = "NewCondition",
  reviews,
  aggregateRating,
}: {
  name: string;
  description?: string;
  image?: string;
  images?: string[];
  price: string;
  currency: string;
  url: string;
  seller: string;
  category?: string;
  sku?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  condition?: "NewCondition" | "UsedCondition" | "RefurbishedCondition";
  reviews?: Array<{
    author: string;
    datePublished: string;
    reviewBody: string;
    reviewRating: number;
  }>;
  aggregateRating?: {
    ratingValue: number;
    ratingCount: number;
  };
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    ...(description && { description }),
    ...(image && { image }),
    ...(images && images.length > 0 && { image: images }),
    ...(sku && { sku }),
    ...(category && { category }),
    url,
    brand: { "@type": "Brand", name: seller },
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
      itemCondition: `https://schema.org/${condition}`,
      seller: {
        "@type": "Organization",
        name: seller,
      },
    },
    ...(aggregateRating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: aggregateRating.ratingValue,
        reviewCount: aggregateRating.ratingCount,
      },
    }),
    ...(reviews && reviews.length > 0 && {
      review: reviews.map((review) => ({
        "@type": "Review",
        author: {
          "@type": "Person",
          name: review.author,
        },
        datePublished: review.datePublished,
        reviewBody: review.reviewBody,
        reviewRating: {
          "@type": "Rating",
          ratingValue: review.reviewRating,
        },
      })),
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function WebsiteJsonLd({
  name,
  url,
  description,
  searchAction,
}: {
  name: string;
  url: string;
  description?: string;
  searchAction?: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    ...(description && { description }),
    ...(searchAction && {
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: searchAction,
        },
        "query-input": "required name=search_term_string",
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationJsonLd({
  name,
  url,
  logo,
  description,
  contactPoint,
  sameAs,
  address,
}: {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  contactPoint?: {
    telephone?: string;
    email?: string;
    contactType?: string;
    areaServed?: string;
    availableLanguage?: string[];
  };
  sameAs?: string[];
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressCountry?: string;
    postalCode?: string;
  };
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    ...(logo && { logo }),
    ...(description && { description }),
    ...(contactPoint && {
      contactPoint: {
        "@type": "ContactPoint",
        ...contactPoint,
      },
    }),
    ...(sameAs && { sameAs }),
    ...(address && {
      address: {
        "@type": "PostalAddress",
        ...address,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function FAQJsonLd({
  questions,
}: {
  questions: Array<{
    question: string;
    answer: string;
  }>;
}) {
  if (!questions.length) return null;

  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function CollectionPageJsonLd({
  name,
  description,
  url,
  products,
}: {
  name: string;
  description?: string;
  url: string;
  products?: Array<{
    name: string;
    url: string;
    image?: string;
    price?: string;
    currency?: string;
  }>;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    ...(description && { description }),
    url,
    ...(products && products.length > 0 && {
      mainEntity: {
        "@type": "ItemList",
        itemListElement: products.map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Product",
            name: product.name,
            url: product.url,
            ...(product.image && { image: product.image }),
            ...(product.price && product.currency && {
              offers: {
                "@type": "Offer",
                price: product.price,
                priceCurrency: product.currency,
              },
            }),
          },
        })),
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
