"use client";

import { FC } from "react";
import Image from "next/image";
import { formatAmount } from "@/utils/formatCurrency";
import Skeleton from "react-loading-skeleton";
import Product from "@/interfaces/items";
import EmptyItem from "./EmptyItem";
import { optimizeImage } from "@/utils/optimizeImage";
import Link from "next/link";
import { StarFilled, StarEmpty } from "@/utils/ItemUtils";

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  columns?: string;
  onClickItem?: (product: Product) => void;
  limit?: number;
  variant?: "grid" | "horizontal";
}

const ProductGrid: FC<ProductGridProps> = ({
  products,
  loading = false,
  columns = "grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3",
  onClickItem,
  limit = 12,
  variant = "grid",
}) => {
  const renderSkeletons = () =>
    Array.from({ length: limit }).map((_, idx) => (
      <div
        key={idx}
        className="bg-gray-50 rounded-xl overflow-hidden shadow relative"
      >
        <Skeleton height={160} className="w-full h-40" />
        <div className="p-3">
          <Skeleton width={80} height={16} className="mb-2" />
          <Skeleton height={16} className="mb-2" />
          <Skeleton height={16} width={60} />
        </div>
      </div>
    ));

  return (
    <>
      {loading ? (
        <div className={`grid ${columns}`}>{renderSkeletons()}</div>
      ) : products.length === 0 ? (
        <EmptyItem message=" No items available." />
      ) : (
        <div className={`grid ${columns}`}>
          {products.map((product) => {
            const salesPrice = parseFloat(product.sales_price);
            const regularPrice = parseFloat(product.regular_price);
            const discount =
              regularPrice > salesPrice
                ? Math.round(((regularPrice - salesPrice) / regularPrice) * 100)
                : 0;

            return (
              <div
                key={product.id}
                onClick={() => onClickItem?.(product)}
                className={`bg-gray-50 rounded-xl overflow-hidden shadow relative group cursor-pointer hover:p-2 hover:shadow-lg transition-shadow
                            ${
                              variant === "horizontal"
                                ? "min-w-45 snap-start"
                                : ""
                            }
                          `}
              >
                {/* Product Image */}
                <div className="relative">
                  <Image
                    src={optimizeImage(
                      product.images?.[0] || "/placeholder.png",
                      400
                    )}
                    alt={product.title}
                    width={500}
                    height={500}
                    className="w-full h-40 object-cover"
                    placeholder="blur"
                    blurDataURL="/placeholder.png"
                    quality={70}
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <Link
                      href={`/items/${product.slug}`}
                      className="pointer-events-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button className="px-6 py-2 bg-hub-primary text-white text-xs font-bold rounded-full shadow-lg hover:bg-hub-secondary transition-all active:scale-95 flex items-center gap-2 cursor-pointer">
                        {product.type === "products" ? (
                          <>
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                              />
                            </svg>
                            Add to Cart
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            Book Now
                          </>
                        )}
                      </button>
                    </Link>
                  </div>

                  {discount > 0 && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white font-bold text-xs px-2 py-1 rounded shadow">
                      -{discount}%
                    </div>
                  )}
                </div>

                <div className="p-3">
                  {/* Title */}
                  <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">
                    {product.title}
                  </h3>
                  <div className="flex items-center text-[8px]! gap-1 text-green-400 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i}>
                        {i < product.average_rating ? (
                          <StarFilled />
                        ) : (
                          <StarEmpty />
                        )}
                      </span>
                    ))}
                  </div>

                  {/* Price */}
                  <p className="flex items-baseline gap-1">
                    <span className="text-sm font-bold text-gray-900">
                      {formatAmount(salesPrice)}
                    </span>

                    {discount > 0 && (
                      <span className="text-[10px] line-through text-gray-600">
                        {formatAmount(regularPrice)}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default ProductGrid;
