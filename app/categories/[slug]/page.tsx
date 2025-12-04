"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getCategoryItems } from "@/lib/api/category";
import Item from "@/interfaces/items";
import ItemDetail from "@/app/items/components/ItemDetail";
import ItemDetailSkeleton from "@/app/items/components/ItemDetailSkeleton";

export default function CategoryProductList() {
  const { category_slug } = useParams<{ category_slug: string }>();

  const [product, setProduct] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log(category_slug);

  useEffect(() => {
    if (!category_slug) return;

    const fetchProduct = async () => {
      try {
        const response = await getCategoryItems(String(category_slug));
        setProduct(response.data.product);
      } catch {
        setError("Failed to load category products");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [category_slug]);

  if (loading) return <ItemDetailSkeleton />;
  if (error) return <p className="p-6 text-red-800">{error}</p>;
  if (!product) return <p className="p-6 text-gray-500">No product found.</p>;

  return <ItemDetail product={product} />;
}
