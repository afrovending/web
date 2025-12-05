"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";
import { useSearchParams } from "next/navigation";
import { listShops } from "@/lib/api/shops";
import { FaMapMarker } from "react-icons/fa";

export default function ShopPageContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "products";

  const { data, isLoading } = useQuery({
    queryKey: ["shops", type],
    queryFn: () => listShops(50, 0, type),
    enabled: !!type,
  });

  const shops = data?.data || [];

  return (
    <div className="px-4 py-10 bg-white">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Our Shops</h2>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={260} className="rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop: any) => (
            <Link
              prefetch={true}
              key={shop.slug}
              href={`/shops/${shop.slug}`}
              className="group bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition"
            >
              {/* Banner */}
              <div className="relative w-full h-40 bg-gray-100">
                <Image
                  src={shop.banner || "/placeholder.png"}
                  alt={shop.name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Info */}
              <div className="p-4">
                {/* Logo + Name */}
                <div className="flex items-center gap-3 mb-3">
                  <Image
                    src={shop.logo || "/placeholder.png"}
                    alt={shop.name}
                    width={48}
                    height={48}
                    className="rounded-full border"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-red-600 transition">
                      {shop.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {shop.category?.name}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {shop.description}
                </p>

                {/* Location */}
                <p className="text-sm text-gray-500 flex items-center">
                  <FaMapMarker /> {shop.city}, {shop.state}
                </p>

                {/* Visit Shop button */}
                <button className="mt-4 btn btn-primary">View Items</button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
