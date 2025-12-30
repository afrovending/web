"use client";

import { useEffect, useState, FC } from "react";
import { ArrowRightCircleIcon } from "@heroicons/react/24/outline";
import { listItems } from "@/lib/api/items";
import Item from "@/interfaces/items";
import { useRouter } from "next/navigation";
import ProductGrid from "../items/components/ProductGrid";

const LatestProducts: FC = () => {
  const [products, setProducts] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const res = await listItems({
          limit: 12,
          offset: 0,
          type: "products",
          status: "active",
          direction: "asc", // or "desc"
        });

        const allProducts = Array.isArray(res.data) ? res.data : [];
        setProducts(allProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);
  return (
    <section className="mb-4">
      <div className="max-w-full mx-auto px-4 md:px-6 lg:px-8 pb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl md:text-xl font-bold text-green-800">
            Latest products
          </h2>
          <ArrowRightCircleIcon
            className="w-6 h-6 text-green-800 cursor-pointer"
            onClick={() => router.push("/items")}
          />
        </div>

        <ProductGrid
          products={products}
          loading={loading}
          columns="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6"
          onClickItem={(product) => router.push(`/items/${product.slug}`)}
        />
      </div>
    </section>
  );
};

export default LatestProducts;
