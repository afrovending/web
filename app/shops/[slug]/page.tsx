"use client";

import { useEffect, useState, useMemo, FC } from "react";
import Image from "next/image";
import { ShoppingBagIcon, HeartIcon } from "@heroicons/react/24/outline";
import Product from "@/interfaces/items";
import { useParams, useRouter } from "next/navigation";
import Skeleton from "react-loading-skeleton";
import debounce from "lodash.debounce";
import { formatAmount } from "@/utils/formatCurrency";
import { listShopItems } from "@/lib/api/shops";

interface ApiResponse {
  status: string;
  message: string;
  data: Product[];
  total: number;
  offset: number;
  limit: number;
}

const Items: FC = () => {
  const params = useParams();
  const slug = Array.isArray(params?.slug)
    ? params.slug[0] // take the first element if it's an array
    : params?.slug ?? "";
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0 });
  const [filters, setFilters] = useState({
    limit: 12,
    offset: 0,
    search: "",
  });

  /** -------------------------
   *  Fetch Items
   * ------------------------- */
  useEffect(() => {
    if (!slug) return; // don't fetch if slug is undefined
    const controller = new AbortController();

    const fetchItems = async () => {
      try {
        setLoading(true);

        const res: ApiResponse = await listShopItems(slug, {
          limit: filters.limit,
          offset: filters.offset,
          search: filters.search,
        });

        setProducts(res.data || []);
        setStats({ total: res.total || 0 });
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Fetch error:", error);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchItems();
    return () => controller.abort();
  }, [slug, filters]);

  /** -------------------------
   *  Debounced Search
   * ------------------------- */
  const debouncedSearch = useMemo(
    () =>
      debounce((text: string) => {
        setFilters((prev) => ({
          ...prev,
          offset: 0,
          search: text,
        }));
      }, 500),
    []
  );

  const handleSearch = (value: string) => {
    debouncedSearch(value);
  };

  /** -------------------------
   *  Pagination
   * ------------------------- */
  const totalPages = Math.ceil(stats.total / filters.limit);
  const currentPage = filters.offset / filters.limit + 1;

  const nextPage = () => {
    if (currentPage < totalPages) {
      setFilters((prev) => ({
        ...prev,
        offset: prev.offset + prev.limit,
      }));
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setFilters((prev) => ({
        ...prev,
        offset: prev.offset - prev.limit,
      }));
    }
  };

  /** -------------------------
   *  Skeleton Loader
   * ------------------------- */
  const renderSkeletons = () =>
    Array.from({ length: filters.limit }).map((_, i) => (
      <div key={i} className="bg-white rounded-xl overflow-hidden shadow">
        <Skeleton height={224} />
        <div className="p-3">
          <Skeleton width={100} />
          <Skeleton width={70} />
        </div>
      </div>
    ));

  /** -------------------------
   *  UI
   * ------------------------- */
  return (
    <div className="p-4 bg-red-50 min-h-screen">
      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search shop items..."
          className="w-full px-3 py-2 border rounded-md border-red-600 text-gray-900 focus:outline-none"
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {loading
          ? renderSkeletons()
          : products.length > 0
          ? products.map((product) => (
              <div
                key={product.id}
                onClick={() => router.push(`/items/${product.slug}`)}
                className="bg-white rounded-xl overflow-hidden shadow relative group cursor-pointer"
              >
                <div className="relative">
                  <Image
                    src={product.images?.[0] ?? "/placeholder.png"}
                    alt={product.title}
                    width={400}
                    height={400}
                    className="w-full h-56 object-cover"
                  />

                  {/* Hover Buttons */}
                  <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button className="bg-white rounded-full p-2 shadow hover:bg-red-100">
                      <ShoppingBagIcon className="w-5 h-5 text-black" />
                    </button>
                    <button className="bg-white rounded-full p-2 shadow hover:bg-red-100">
                      <HeartIcon className="w-5 h-5 text-black" />
                    </button>
                  </div>
                </div>

                <div className="p-3">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
                    {product.title}
                  </h3>

                  <p className="text-sm font-bold text-gray-800">
                    {formatAmount(product.sales_price)}
                  </p>
                </div>
              </div>
            ))
          : !loading && (
              <div className="col-span-full text-center py-10">
                <p className="text-gray-500 text-lg">No items available.</p>
              </div>
            )}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-center gap-4 text-red-900">
        <button
          onClick={prevPage}
          disabled={currentPage === 1}
          className="btn btn-gray shadow disabled:opacity-50"
        >
          Previous
        </button>

        <span className="font-medium">
          Page {currentPage} of {totalPages || 1}
        </span>

        <button
          onClick={nextPage}
          disabled={currentPage === totalPages}
          className="btn btn-gray shadow disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Items;
