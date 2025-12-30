"use client";

import { useState, useRef, useEffect } from "react";
import {
  CalendarIcon,
  ClockIcon,
  InformationCircleIcon,
  StarIcon,
} from "@heroicons/react/24/solid";
import Image from "next/image";
import parse from "html-react-parser";
import ProductGrid from "./ProductGrid";
import EmptyItem from "./EmptyItem";
import { formatHumanReadableDate } from "@/utils/formatDate";
import Item from "@/interfaces/items";

interface ReviewUser {
  id: number;
  name: string;
  last_name?: string;
  profile_photo: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface Review {
  id: number;
  product_id: number;
  order_id: number;
  user_id: number;
  comment: string;
  images: string[];
  image_public_ids: string[];
  rating: number;
  created_at: string;
  updated_at: string;
  user: ReviewUser;
}

export interface StarRatingLevel {
  id: number;
  rating: number; // 1-5
  comment: string;
  user: { name: string; profile_photo: string };
}

export interface StarRating {
  total: number;
  reviews: StarRatingLevel[];
}

interface ItemTabsProps {
  product: Item;
  description: string;
  reviews: Review[];
  star_rating: StarRating;
  recommended: Item[];
  frequentlyBoughtTogether: Item[];
}

export default function ItemTabs({
  product,
  description,
  reviews,
  star_rating,
  recommended,
  frequentlyBoughtTogether,
}: ItemTabsProps) {
  const [activeTab, setActiveTab] = useState<
    "description" | "reviews" | "service_details"
  >("description");

  // Compute rating distribution
  const ratingPercentages = [5, 4, 3, 2, 1].map((star) => {
    const count = star_rating.reviews.filter((r) => r.rating === star).length;
    return {
      star,
      count,
      percentage: star_rating.total ? (count / star_rating.total) * 100 : 0,
    };
  });

  const [showAllReviews, setShowAllReviews] = useState(false);

  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3);
  const descriptionRef = useRef<HTMLDivElement | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [canToggleDescription, setCanToggleDescription] = useState(false);

  useEffect(() => {
    if (!descriptionRef.current) return;

    const el = descriptionRef.current;

    const isOverflowing = el.scrollHeight > el.clientHeight;
    setCanToggleDescription(isOverflowing);
  }, [description]);

  return (
    <div className="bg-gray-50">
      <div className="flex justify-center border-b border-gray-300">
        <button
          onClick={() => setActiveTab("description")}
          className={`px-4 py-2 text-sm font-medium cursor-pointer ${
            activeTab === "description"
              ? "border-b-2 border-green-800 text-green-800"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          Description
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={`px-4 py-2 text-sm font-medium cursor-pointer ${
            activeTab === "reviews"
              ? "border-b-2 border-green-800 text-green-800"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          Reviews
        </button>
        {product.type === "services" && (
          <button
            onClick={() => setActiveTab("service_details")}
            className={`px-4 py-2 text-sm font-medium cursor-pointer transition-colors ${
              activeTab === "service_details"
                ? "border-b-2 border-green-800 text-green-800"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Service Details
          </button>
        )}
      </div>

      <div className="mt-4 p-4 text-gray-600">
        {activeTab === "description" && (
          <div className="animate-fadeIn">
            <div className="prose max-w-none text-gray-700">
              <div
                ref={descriptionRef}
                className={showFullDescription ? "" : "line-clamp-5"}
              >
                {parse(description)}
              </div>

              {canToggleDescription && (
                <button
                  onClick={() => setShowFullDescription((prev) => !prev)}
                  className="mt-2 text-green-800 font-medium text-sm"
                >
                  {showFullDescription ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* REVIEWS */}
        {activeTab === "reviews" && (
          <div className="animate-fadeIn">
            <div className="space-y-6">
              {/* Star Summary */}
              <div className="mb-4 border-b border-gray-200 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold">
                    {star_rating.total
                      ? (
                          star_rating.reviews.reduce(
                            (sum, r) => sum + r.rating,
                            0
                          ) / star_rating.total
                        ).toFixed(1)
                      : 0}
                  </span>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`w-5 h-5 ${
                          i <
                          (star_rating.total
                            ? Math.round(
                                star_rating.reviews.reduce(
                                  (sum, r) => sum + r.rating,
                                  0
                                ) / star_rating.total
                              )
                            : 0)
                            ? "text-green-500"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-gray-400">
                    ({star_rating.total} reviews)
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  {ratingPercentages.map((r) => (
                    <div key={r.star} className="flex items-center gap-2">
                      <span className="text-sm">{r.star} star</span>
                      <div className="bg-gray-200 h-2 flex-1 rounded overflow-hidden">
                        <div
                          className="bg-green-500 h-2"
                          style={{ width: `${r.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Individual Reviews */}
              {reviews.length === 0 ? (
                <p className="text-center text-gray-500">
                  Customers who bought this item are yet to review.
                </p>
              ) : (
                <>
                  {visibleReviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b border-gray-200 pb-4"
                    >
                      <div className="flex items-center gap-3">
                        <Image
                          src={review.user.profile_photo}
                          alt={review.user.name}
                          className="w-10 h-10 rounded-full"
                          width={40}
                          height={40}
                        />
                        <div>
                          <p className="text-sm font-semibold">
                            {review.user.name}
                          </p>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? "text-green-500"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="ml-auto text-xs text-gray-400">
                          {formatHumanReadableDate(review.created_at)}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-col sm:flex-row gap-4">
                        {/* Comment */}
                        <p className="text-gray-600 text-sm flex-1">
                          {review.comment}
                        </p>

                        {/* Review Images */}
                        {review.images?.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {review.images.map((img, idx) => (
                              <Image
                                key={idx}
                                src={img}
                                alt={`Review ${review.id} image ${idx}`}
                                width={60} // reduced size
                                height={60} // reduced size
                                className="rounded-md object-cover"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Read More Button */}
                  {!showAllReviews && reviews.length > 3 && (
                    <button
                      onClick={() => setShowAllReviews(true)}
                      className="btn btn-gray mx-auto block"
                    >
                      Read more reviews
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* SERVICE DETAILS / AVAILABILITY */}
        {activeTab === "service_details" && (
          <div className="animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                  <CalendarIcon className="w-4 h-4 text-green-800" />
                  Availability Schedule
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <span className="text-sm text-gray-500">Service Days</span>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {product.available_days?.map((day: string) => (
                        <span
                          key={day}
                          className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-bold uppercase text-gray-700"
                        >
                          {day.substring(0, 3)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Working Hours</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {product.available_from} — {product.available_to}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fulfillment Section */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                  <ClockIcon className="w-4 h-4 text-green-800" />
                  Fulfillment Info
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <span className="text-sm text-gray-500">
                      Service Duration
                    </span>
                    <span className="text-sm font-semibold text-gray-800">
                      {product.estimated_delivery_time}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <span className="text-sm text-gray-500">Method</span>
                    <span className="text-sm font-semibold text-gray-800 capitalize">
                      {product.delivery_method}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Pricing Model</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-bold uppercase">
                      {product.pricing_model}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notice for Negotiable Pricing */}
            {product.pricing_model === "negotiable" && (
              <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-100 flex items-start gap-3">
                <InformationCircleIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Note on Pricing:</strong> This service uses a
                  negotiable pricing model. The displayed price is a starting
                  point. Final costs may vary based on your specific
                  requirements discussed during booking.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ------------------- RECOMMENDED / SIMILAR / MOST VIEWED ------------------- */}
      <div className="mt-6 p-4 bg-gray-100">
        <h2 className="text-xs sm:text-sm font-semibold mb-4">
          Frequently bought together
        </h2>
        {frequentlyBoughtTogether.length === 0 ? (
          <EmptyItem message="No Frequently bought together items" />
        ) : (
          <ProductGrid
            products={frequentlyBoughtTogether}
            columns="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4"
          />
        )}

        <h2 className="text-xs sm:text-sm font-semibold mb-4 mt-8">
          Recommended for you
        </h2>
        {recommended.length === 0 ? (
          <EmptyItem message="No recommended items" />
        ) : (
          <ProductGrid
            products={recommended}
            columns="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4"
          />
        )}
      </div>
    </div>
  );
}
