"use client";

import { useEffect, useState, FC, useMemo } from "react";
import Image from "next/image";
import Product, { Category } from "@/interfaces/items";
import { useRouter, useSearchParams } from "next/navigation";
import Skeleton from "react-loading-skeleton";
import { listItems } from "@/lib/api/items";
import debounce from "lodash.debounce";
import ProductGrid from "./components/ProductGrid";
import Link from "next/link";
import FilterDrawer from "./components/FilterDrawer";
import RequestLocation from "../components/common/RequestLocation";

interface ItemsProps {
  params: { slug: string };
}

interface ApiResponse {
  status: string;
  message: string;
  category_info: Category | null;
  data: Product[];
  total: number;
  offset: number;
  limit: number;
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
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState<{
    limit: number;
    offset: number;
    search: string;
    type: string;
    status: string;
    category: string;
    sort: "asc" | "desc";
    availability?: string;
    rating?: number;
  }>({
    limit: 20,
    offset: 0,
    search: "",
    type: queryType,
    status: "active",
    category: queryCategory,
    sort: "asc",
    availability: undefined,
    rating: undefined,
  });

  // Fetch products
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);

        const params = {
          limit: filters.limit,
          offset: filters.offset,
          search: filters.search || undefined,
          type: filters.type,
          status: filters.status,
          category: filters.category || undefined,
          direction: filters.sort,
          availability: filters.availability,
        };

        const res: ApiResponse = await listItems(params);

        setProducts(res.data || []);
        setCategoryInfo(res.category_info || null);
        setTotal(res.total || 0);
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
      offset: 0,
    }));
  }, [queryType, queryCategory]);

  // debounce search updates by 500ms
  const debouncedSetSearch = useMemo(
    () =>
      debounce((value: string) => {
        setFilters((prev) => ({ ...prev, search: value, offset: 0 }));
      }, 500),
    []
  );

  useEffect(() => {
    return () => {
      debouncedSetSearch.cancel();
    };
  }, [debouncedSetSearch]);

  const totalPages = Math.ceil(total / filters.limit);
  const currentPage = Math.floor(filters.offset / filters.limit) + 1;

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setFilters((prev) => ({ ...prev, offset: (newPage - 1) * prev.limit }));
  };

  return (
    <>
      {!categoryInfo && (
        <div className="relative w-full h-40 md:h-48 lg:h-56">
          <Image
            src="/account-header.jpg"
            alt="Account Header"
            fill
            className="object-cover brightness-39"
            priority
          />

          <div className="absolute inset-0 flex flex-col justify-center px-5 md:px-10 text-white">
            <h1 className="text-2xl md:text-3xl text-white! font-semibold">
              All {queryType}
            </h1>

            <div className="text-sm mt-2 opacity-90">
              <Link href="/" className="hover:underline">
                Home
              </Link>{" "}
              /<span className="ml-1">{queryType}</span>
            </div>
          </div>
        </div>
      )}
      <div className="mx-auto sm:px-4 px-4 py-12 min-h-screen">
        {/* Category Header */}
        {loading ? (
          <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
            <Skeleton circle width={144} height={144} className="mb-4" />
            <Skeleton height={36} width={250} className="mb-2" />
            <Skeleton count={2} />
          </div>
        ) : (
          categoryInfo && (
            <header className="relative mb-10 rounded-xl overflow-hidden shadow-xl">
              {/* Background Image */}
              {categoryInfo.image && (
                <div className="absolute inset-0">
                  <Image
                    src={categoryInfo.image}
                    alt={categoryInfo.name}
                    fill
                    className="object-cover w-full h-full brightness-75"
                  />
                  <div className="absolute inset-0 bg-black/40"></div>
                </div>
              )}

              {/* Caption Content */}
              <div className="relative z-10 p-6 flex flex-col justify-end h-64">
                <h1 className="sm:text-4xl text-sm font-extrabold text-white! mb-2">
                  {categoryInfo.name}
                </h1>
                {categoryInfo.description && (
                  <p className="sm:text-lg text-xs text-white/80! mb-4 line-clamp-2">
                    {categoryInfo.description}
                  </p>
                )}
              </div>
            </header>
          )
        )}

        {/* Product Grid */}
        <div className="flex justify-start mb-4">
          <FilterDrawer
            filters={filters}
            setFilters={setFilters}
            debouncedSetSearch={debouncedSetSearch}
            type={queryType}
          />
        </div>

        <main className="col-span-12 lg:col-span-9">
          <ProductGrid
            products={products}
            loading={loading}
            columns="grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3"
            onClickItem={(product) => router.push(`/items/${product.slug}`)}
          />

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-12">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn btn-gray w-1/7"
              >
                Previous
              </button>
              <span className="text-green-800 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="btn btn-gray w-1/7"
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>
      <RequestLocation />
    </>
  );
};

export default Items;
