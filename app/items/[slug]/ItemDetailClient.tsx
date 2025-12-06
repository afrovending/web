"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ItemDetail from "../components/ItemDetail";
import { getItemDetail } from "@/lib/api/items";

export default function ItemDetailClient() {
  const params = useParams();
  const slugParam = params.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await getItemDetail(slug);
        if (!response.data.product) {
          setError("Product not found.");
        } else {
          setProduct(response.data.product);
        }
      } catch (err) {
        console.error("Failed to fetch product:", err);
        setError("Failed to load product.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (error)
    return <div className="p-10 text-center text-red-500">{error}</div>;

  // JSON-LD SEO schema
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.images?.slice(0, 1) || [],
    description: product.description,
    sku: product.sku || product.id,
    brand: { "@type": "Brand", name: "Afrovending Online Marketplace" },
    offers: {
      "@type": "Offer",
      url: `https://ayokah.co.uk/items/${product.slug}`,
      priceCurrency: "GBP",
      price: product.sales_price,
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product.quantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
    aggregateRating:
      product.average_rating > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.average_rating,
            reviewCount: product.reviews?.length || 0,
          }
        : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <ItemDetail product={product} />
    </>
  );
}
