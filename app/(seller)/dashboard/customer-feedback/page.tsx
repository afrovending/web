"use client";

import { Review } from "@/interfaces/reviews";
import { listVendorReviews } from "@/lib/api/seller/reviews";
import { formatHumanReadableDate } from "@/utils/formatDate";
import { useEffect, useState } from "react";
import { LuMessageCircle } from "react-icons/lu";

export default function Orders() {
  const LIMIT = 3;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  /** FETCH REVIEWS */
  async function fetchReviews(loadMore = false) {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setOffset(0);
      }

      const response = await listVendorReviews({
        limit: LIMIT,
        offset: offset - 1,
      });

      const data = response?.data || [];

      setTotal(response.total || 0);

      if (loadMore) {
        setReviews((prev) => [...prev, ...data]);
      } else {
        setReviews(data);
      }

      // Only increase offset if we actually received data
      if (data.length > 0) {
        setOffset((prev) => prev + LIMIT);
      }
    } catch (err) {
      console.error("Error loading reviews:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    fetchReviews(false);
  }, []);

  const hasMore = reviews.length < total;

  return (
    <div>
      {/* HEADER CARD */}
      <div className="card mb-6 hover:shadow-lg transition-all duration-300 rounded-xl bg-white cursor-default p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-green-800!">
            <LuMessageCircle /> Customer Feedback
          </h2>
        </div>
        <p className="text-sm mt-1 text-gray-600">
          From your dashboard, you can easily access and control your recent
          <span className="text-green-800"> customer reviews</span>.
        </p>
      </div>

      <div className="space-y-6 mt-6">
        {/* INITIAL SKELETON LOADING */}
        {loading && (
          <>
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white p-4 rounded-xl shadow-sm border animate-pulse"
              >
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg" />

                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* EMPTY */}
        {!loading && reviews.length === 0 && (
          <div className="py-6 card text-center text-green-800 text-sm">
            No customer reviews yet.
          </div>
        )}

        {/* REVIEWS LIST */}
        {!loading &&
          reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white p-4 rounded-xl shadow-sm border hover:shadow-md transition cursor-pointer"
            >
              <div className="flex gap-4">
                <img
                  src={review.product?.images?.[0] || "/placeholder.svg"}
                  alt={review.product?.title}
                  className="w-20 h-20 object-cover rounded-lg bg-gray-100"
                />

                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">
                    {review.product?.title}
                  </h3>

                  {/* RATING */}
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <span
                        key={index}
                        className={`text-lg ${
                          index < review.rating
                            ? "text-green-800"
                            : "text-gray-300"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>

                  <p className="text-sm mt-2 text-gray-700">{review.comment}</p>

                  <p className="text-xs text-gray-500 mt-2">
                    {formatHumanReadableDate(review.created_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}

        {/* LOAD MORE BUTTON */}
        {!loading && hasMore && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => fetchReviews(true)}
              disabled={loadingMore}
              className="btn btn-primary"
            >
              {loadingMore ? "Loading..." : "Load more reviews"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
