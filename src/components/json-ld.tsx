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
}: {
  name: string;
  description: string;
  url: string;
  logo?: string;
  image?: string;
  address?: string;
  city?: string;
  country?: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    description,
    url,
    ...(logo && { logo }),
    ...(image && { image }),
    ...((address || city) && {
      address: {
        "@type": "PostalAddress",
        ...(address && { streetAddress: address }),
        ...(city && { addressLocality: city }),
        ...(country && { addressCountry: country }),
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

export function ProductJsonLd({
  name,
  description,
  image,
  price,
  currency,
  url,
  seller,
}: {
  name: string;
  description?: string;
  image?: string;
  price: string;
  currency: string;
  url: string;
  seller: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    ...(description && { description }),
    ...(image && { image }),
    url,
    brand: { "@type": "Brand", name: seller },
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: currency,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
