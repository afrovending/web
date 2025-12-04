"use client";

import { useEffect, useState, FC } from "react";
import Image from "next/image";
import { ShoppingBagIcon, HeartIcon } from "@heroicons/react/24/outline";
import Product, { Category } from "@/interfaces/items";
import { useRouter, useSearchParams } from "next/navigation";
import Skeleton from "react-loading-skeleton";
import { listItems } from "@/lib/api/items";
import debounce from "lodash.debounce";
import { useMemo } from "react";
import { formatAmount } from "@/utils/formatCurrency";

interface ItemsProps {
  params: { slug: string };
}
interface ApiResponse {
  status: string;
  message: string;
  category_info: Category | null;
  data: Product[];
  total: number;
  offset: string | number;
  limit: string | number;
  stats: Record<string, number>;
}

const Items: FC<ItemsProps> = ({}) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryType = searchParams.get("type") || "products";
  const queryCategory = searchParams.get("category") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryInfo, setCategoryInfo] = useState<Category | null>(null);
  const [filters, setFilters] = useState({
    limit: 12,
    offset: 0,
    search: "",
    type: queryType,
    status: "active",
    category: queryCategory,
    sort: "latest",
    max_price: undefined as number | undefined,
    availability: undefined as string | undefined,
    rating: undefined as number | undefined,
  });

  // Fetch products
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);

        const res: ApiResponse = await listItems(
          filters.limit,
          filters.offset,
          filters.search,
          filters.type,
          filters.status,
          filters.category,
          filters.sort,
          filters.max_price,
          filters.availability
        );

        setProducts(res.data || []);
        setCategoryInfo(res.category_info || null);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [filters]);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      type: queryType,
      category: queryCategory,
    }));
  }, [queryType, queryCategory]);

  // debounce search updates by 500ms
  const debouncedSetSearch = useMemo(
    () =>
      debounce((value: string) => {
        setFilters((prev) => ({ ...prev, search: value }));
      }, 500),
    []
  );

  useEffect(() => {
    return () => {
      debouncedSetSearch.cancel();
    };
  }, [debouncedSetSearch]);

  // Skeleton UI while loading
  const renderSkeletons = () =>
    Array.from({ length: 12 }).map((_, idx) => (
      <div
        key={idx}
        className="bg-white rounded-xl overflow-hidden shadow relative"
      >
        <Skeleton height={224} className="w-full h-56" />
        <div className="p-3">
          <Skeleton width={80} height={16} className="mb-2" />
          <Skeleton height={16} className="mb-2" />
          <Skeleton height={16} width={60} />
        </div>
      </div>
    ));

  return (
    <div className="p-4 bg-white  h-full">
      {loading ? (
        // Skeleton for the header
        <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
          <Skeleton circle width={144} height={144} className="mb-4" />
          <Skeleton height={36} width={250} className="mb-2" />
          <Skeleton count={2} />
        </div>
      ) : (
        categoryInfo && (
          // The actual header content
          <div className="mb-6 bg-white p-6 rounded-lg shadow-md flex flex-col md:flex-row items-center gap-6">
            {categoryInfo.image && (
              <Image
                src={categoryInfo.image}
                alt={categoryInfo.name}
                width={150}
                height={150}
                className="w-36 h-36 rounded-full object-cover border-4 border-red-100 shrink-0"
              />
            )}
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {categoryInfo.name}
              </h1>
              <div
                className="text-gray-600 prose"
                dangerouslySetInnerHTML={{ __html: categoryInfo.description }}
              />
            </div>
          </div>
        )
      )}
      <main className="col-span-12 lg:col-span-9">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {loading ? (
            renderSkeletons()
          ) : products.length > 0 ? (
            products.map((product) => (
              <div
                onClick={() => router.push(`/items/${product.slug}`)}
                key={product.id}
                className="bg-white rounded-xl overflow-hidden shadow relative group cursor-pointer"
              >
                {/* Image */}
                <div className="relative">
                  <Image
                    src={product.images[0] || "/placeholder.png"}
                    alt={product.title}
                    width={400}
                    height={400}
                    className="w-full h-56 object-cover"
                  />
                  <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button className="bg-white rounded-full p-2 shadow hover:bg-red-100">
                      <ShoppingBagIcon className="w-5 h-5 text-black cursor-pointer" />
                    </button>
                    <button className="bg-white rounded-full p-2 shadow hover:bg-red-100">
                      <HeartIcon className="w-5 h-5 text-black cursor-pointer" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="flex items-center gap-1 text-yellow-400 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i}>
                        {i < product.average_rating ? "★" : "☆"}
                      </span>
                    ))}
                  </div>

                  <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">
                    {product.title}
                  </h3>

                  <p className="text-sm font-semibold text-gray-800">
                    {formatAmount(product.sales_price)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-gray-500 text-lg">No items available.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Items;
