"use client";

import { useEffect, useState, useMemo, FC } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import Skeleton from "react-loading-skeleton";
import debounce from "lodash.debounce";
import { listShopItems } from "@/lib/api/shops";
import Product from "@/interfaces/items";
import { Shop } from "@/interfaces/shop";
import ProductGrid from "@/app/items/components/ProductGrid";

interface ApiResponse {
  status: string;
  message: string;
  data: Product[];
  shop: Shop;
  total: number;
  offset: number;
  limit: number;
}

interface ReadMoreProps {
  text: string;
  lines?: number;
}

const ReadMore: FC<ReadMoreProps> = ({ text, lines = 2 }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="text-sm text-gray-600 mt-1">
      <p
        className={`transition-all duration-300 overflow-hidden ${
          !expanded ? `line-clamp-${lines}` : ""
        }`}
      >
        {text}
      </p>
      {text.split(" ").length > 15 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-green-800 hover:underline mt-1 block cursor-pointer"
        >
          {expanded ? "Read Less" : "Read More"}
        </button>
      )}
    </div>
  );
};

const ShopItems: FC = () => {
  const params = useParams();
  const slug = Array.isArray(params?.slug)
    ? params.slug[0]
    : params?.slug ?? "";
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<Shop | null>(null);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({ limit: 12, offset: 0, search: "" });

  const totalPages = Math.ceil(total / filters.limit);
  const currentPage = filters.offset / filters.limit + 1;

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();

    const fetchItems = async () => {
      try {
        setLoading(true);
        const res: ApiResponse = await listShopItems(slug, filters);
        setProducts(res.data || []);
        setShop(res.shop);
        setTotal(res.total);
      } catch (err) {
        if (!controller.signal.aborted) console.error("Fetch error:", err);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchItems();
    return () => controller.abort();
  }, [slug, filters]);

  const handleSearch = useMemo(
    () =>
      debounce((value: string) => {
        setFilters((prev) => ({ ...prev, search: value, offset: 0 }));
      }, 500),
    []
  );

  const nextPage = () => {
    if (currentPage < totalPages)
      setFilters((prev) => ({ ...prev, offset: prev.offset + prev.limit }));
  };

  const prevPage = () => {
    if (currentPage > 1)
      setFilters((prev) => ({ ...prev, offset: prev.offset - prev.limit }));
  };

  const renderSkeletons = () =>
    Array.from({ length: filters.limit }).map((_, i) => (
      <div key={i} className="bg-white rounded-xl overflow-hidden shadow">
        <Skeleton height={124} />
        <div className="p-3">
          <Skeleton width={100} />
          <Skeleton width={70} />
        </div>
      </div>
    ));

  return (
    <div className="bg-gray-50">
      {/* Shop Header */}
      {shop && (
        <div className="mb-6 rounded-xl bg-white shadow">
          <div className="relative w-full h-52 sm:h-64 bg-gray-200 overflow-hidden">
            {shop.banner ? (
              <Image
                src={shop.banner}
                alt={shop.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-linear-to-r from-green-200 to-amber-300" />
            )}
            {shop.logo && (
              <div className="absolute left-1/2 sm:left-6 top-full -translate-x-1/2 sm:translate-x-0 -translate-y-2/3">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white bg-white shadow-xl top-full -translate-y-1/4">
                  <Image
                    src={shop.logo}
                    alt={shop.name}
                    fill
                    className="object-cover rounded-full"
                  />
                </div>
              </div>
            )}
          </div>
          <div className="pt-16 sm:pt-20 px-4 sm:px-6 pb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {shop.name}
              </h1>
              {shop.description && <ReadMore text={shop.description} />}
              <p className="text-xs text-gray-500 mt-2">
                {[shop.city, shop.state, shop.country]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      {totalPages > 1 && (
        <div className="mb-4 px-4 sm:px-6">
          <input
            type="text"
            placeholder="Search shop items..."
            className="w-full px-3 py-2 border rounded-md border-amber-600 text-gray-900 focus:outline-none"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      )}

      {/* Items Grid */}
      <ProductGrid
        products={products}
        loading={loading}
        columns="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4"
        onClickItem={(product) => router.push(`/items/${product.slug}`)}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className="btn btn-gray"
          >
            Previous
          </button>
          <span className="font-medium text-green-800">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className="btn btn-gray"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ShopItems;
