"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";
import { useSearchParams } from "next/navigation";
import { FaMapMarker } from "react-icons/fa";
import { listShops, ShopsResponse } from "@/lib/api/shops";
import { Shop } from "@/interfaces/shop";

export default function ShopPageContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "products";

  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const limit = 9;
  const offset = (page - 1) * limit;
  const totalPages = Math.ceil(total / limit);

  // Fetch shops
  useEffect(() => {
    const fetchShops = async () => {
      try {
        setLoading(true);
        const res: ShopsResponse = await listShops(limit, offset, type);
        setShops(res.data || []);
        setTotal(res.total || 0);
      } catch (error) {
        console.error("Error fetching shops:", error);
        setShops([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, [type, page]);

  const handlePrev = () => setPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () => setPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <div className="px-4 py-10 bg-white">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Our Shops</h2>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: limit }).map((_, i) => (
            <Skeleton key={i} height={260} className="rounded-xl" />
          ))}
        </div>
      ) : shops.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop: Shop) => (
              <Link
                key={shop.slug}
                prefetch={true}
                href={`/shops/${shop.slug}`}
                className="group bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition"
              >
                <div className="relative w-full h-40 bg-gray-100">
                  <Image
                    src={shop.banner || "/placeholder.png"}
                    alt={shop.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Image
                      src={shop.logo || "/placeholder.png"}
                      alt={shop.name}
                      width={48}
                      height={48}
                      className="rounded-full border"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition">
                        {shop.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {shop.category?.name}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {shop.description}
                  </p>

                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <FaMapMarker /> {shop.city}, {shop.state}
                  </p>

                  <button className="mt-4 btn btn-primary w-full">
                    Visit Shop
                  </button>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={handlePrev}
              disabled={page === 1}
              className="btn btn-gray"
            >
              Previous
            </button>

            <span className="text-green-700 font-medium">
              Page {page} of {totalPages || 1}
            </span>

            <button
              onClick={handleNext}
              disabled={page === totalPages || totalPages === 0}
              className="btn btn-gray"
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <div className="col-span-full text-center py-10 flex flex-col items-center gap-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-16 h-16 text-gray-300 animate-pulse"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h18v18H3V3z"
            />
          </svg>
          <p className="text-gray-500 text-lg font-semibold">
            No shops available.
          </p>
        </div>
      )}
    </div>
  );
}
