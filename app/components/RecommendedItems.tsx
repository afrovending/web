"use client";

import { useEffect, useState, FC } from "react";
import { listRecommendedItems } from "@/lib/api/items";
import Item from "@/interfaces/items";
import { useRouter } from "next/navigation";
import ProductGrid from "../items/components/ProductGrid";
import { LuCircleArrowOutUpRight } from "react-icons/lu";

interface RecommendedItemsProps {
  type: string;
}

const RecommendedItems: FC<RecommendedItemsProps> = ({ type }) => {
  const [products, setProducts] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const res = await listRecommendedItems(type);
        setProducts(res.data);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [type]);

  return (
    <section className="mb-4">
      <div className="max-w-full mx-auto px-4 md:px-6 lg:px-4 pb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm md:text-xl font-bold">
            {type === "products"
              ? "Recommended Products for You"
              : "Nearby Services for You"}
          </h2>
          <LuCircleArrowOutUpRight
            className="w-4 h-4 text-hub-primary cursor-pointer transition hover:text-hub-secondary"
            onClick={() => router.push("/items?type=" + type)}
          />
        </div>

        <ProductGrid
          products={products}
          loading={loading}
          columns="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4"
          onClickItem={(product) => router.push(`/items/${product.slug}`)}
        />

        {/* Fancy View More Button */}
        {!loading && products.length > 24 && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => router.push("/items?type=" + type)}
              className="px-6 py-3 bg-hub-primary text-white font-semibold rounded-lg shadow-lg hover:bg-hub-secondary hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              View more {type}
              <LuCircleArrowOutUpRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default RecommendedItems;
