"use client";

import { listOrders, submitReview } from "@/lib/api/orders";
import { debounce } from "lodash";
import { useState, useCallback, useMemo, useEffect } from "react";
import { FiPackage } from "react-icons/fi";
import { SkeletonOrderCard } from "./components/SkeletonOrderCard";
import { CustomerOrder, CustomerOrdersResponse } from "@/interfaces/orders";
import { formatAmount } from "@/utils/formatCurrency";
import { formatHumanReadableDate } from "@/utils/formatDate";
import Link from "next/link";
import Image from "next/image";
import StatusBadge from "@/utils/StatusBadge";
import ConfirmationModal from "@/app/(seller)/dashboard/components/commons/ConfirmationModal";
import SelectDropdown from "@/app/(seller)/dashboard/components/commons/Fields/SelectDropdown";

export default function Orders() {
  const PAGE_SIZE = 2;

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [offset, setOffset] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);

  // --- Modal states ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewingOrder, setReviewingOrder] = useState<CustomerOrder | null>(
    null
  );
  const [reviewRating, setReviewRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewImages, setReviewImages] = useState<File[]>([]);

  const fetchOrders = useCallback(
    async (offsetValue: number, searchValue: string, isLoadMore = false) => {
      try {
        if (!isLoadMore) setLoading(true);

        const response: CustomerOrdersResponse = await listOrders(
          PAGE_SIZE,
          offsetValue,
          searchValue
        );

        if (isLoadMore) {
          setOrders((prev) => [...prev, ...response.data]);
        } else {
          setOrders(response.data);
        }

        setTotalOrders(response.total);

        // --- Automatically show modal if any order is yet_to_review ---
        const toReviewOrder = response.data.find((o) => o.yet_to_review);
        if (toReviewOrder) {
          setReviewingOrder(toReviewOrder);
          setIsModalOpen(true);
        }
      } catch (err) {
        console.error(err);
        setError("An error occurred while fetching orders.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  const debouncedFetch = useMemo(
    () =>
      debounce((off, srch) => {
        fetchOrders(off, srch);
      }, 300),
    [fetchOrders]
  );

  useEffect(() => {
    setOffset(0);
    debouncedFetch(0, search);
    return () => debouncedFetch.cancel();
  }, [search]);

  const handleLoadMore = async () => {
    const newOffset = offset + PAGE_SIZE;
    setOffset(newOffset);
    setLoadingMore(true);

    await fetchOrders(newOffset, search, true);
  };

  // --- Handle Review Submit ---
  const handleReviewSubmit = async () => {
    if (!reviewingOrder) return;

    try {
      setReviewLoading(true);

      const formData = new FormData();
      formData.append("order_id", reviewingOrder.id.toString());
      formData.append(
        "product_id",
        reviewingOrder.order_items[0].product.id.toString()
      ); // first product
      formData.append("rating", reviewRating.toString());
      formData.append("comment", reviewComment);
      // Append images if any
      reviewImages.forEach((file, index) => {
        formData.append("images[]", file);
      });
      await submitReview(formData);

      // Close modal
      setIsModalOpen(false);

      // Refresh orders to update yet_to_review
      fetchOrders(0, search);

      // Reset review states
      setReviewRating(0);
      setReviewComment("");
      setReviewImages([]); // reset images
      setReviewingOrder(null);
    } catch (err) {
      console.error(err);
      alert("Failed to submit review.");
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div>
      <div className="card mb-6">
        <h2 className="text-lg font-semibold flex items-center">
          <FiPackage className="text-green-800 text-xl mr-2" size={24} />
          Orders
        </h2>
        <p className="text-sm mt-1 text-gray-600">
          From your account, you can easily manage your recent
          <span className="text-green-800"> orders </span>
        </p>
      </div>

      {/* Search */}
      <div className="mb-4" hidden>
        <input
          type="text"
          placeholder="Search orders by product name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-green-200 rounded-lg px-3 py-2 w-full focus:outline-none"
        />
      </div>

      {/* Loading (Initial) */}
      {loading && orders.length === 0 ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonOrderCard key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-10 text-green-800">
          <FiPackage className="text-green-800 text-xl mr-2" size={24} />

          <p className="text-lg font-medium">{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-500 animate-fadeIn card">
          <FiPackage className="text-green-800 text-xl mr-2" size={24} />

          <h3 className="text-xl font-semibold mb-1">No Orders Found</h3>
          <p className="text-sm text-gray-400 text-center max-w-xs">
            You currently have no orders
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card">
              {/* Header */}
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">
                  Order #{order.id}
                </h3>

                <StatusBadge status={order.shipping_status} type="shipping" />

                <Link
                  prefetch={true}
                  href={`/account/orders/${order.id}`}
                  className="btn btn-gray text-xs"
                >
                  View detail
                </Link>
              </div>

              {/* Meta */}
              <div className="mt-2 text-sm space-y-1">
                <p>
                  Total: <strong>{formatAmount(order.total)}</strong>
                </p>
                <p>Payment: {order.payment_status}</p>

                {order.delivery_date && (
                  <p>
                    Delivery: {formatHumanReadableDate(order.delivery_date)}
                  </p>
                )}

                {order.shipping_fee && (
                  <p>Shipping Fee: {formatAmount(order.shipping_fee)}</p>
                )}

                {order.tracking_number && (
                  <p>
                    Tracking:{" "}
                    {order.tracking_url ? (
                      <a
                        href={order.tracking_url}
                        className="text-green-800 underline"
                      >
                        {order.tracking_number}
                      </a>
                    ) : (
                      order.tracking_number
                    )}
                  </p>
                )}
              </div>

              {/* Items */}
              <div className="mt-4 border-t border-green-200 pt-4 space-y-4">
                {order.order_items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/items/${item.product.slug}`}
                    prefetch={true}
                  >
                    <div className="flex items-center gap-4">
                      <Image
                        width={64}
                        height={64}
                        alt="product image"
                        src={item.product.images[0]}
                        className="w-16 h-16 rounded object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.product.title}</p>
                        <p className="text-sm text-gray-600">
                          Qty: {item.quantity} • {formatAmount(item.subtotal)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* LOAD MORE */}
          {orders.length < totalOrders && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="btn btn-primary  w-full sm:w-1/2"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* review model */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setReviewImages([]);
        }}
        title="Leave a Review"
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Please review your recent order #{reviewingOrder?.id}.
          </p>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Rating
            </label>
            <SelectDropdown
              options={[
                { label: "Select rating", value: "0" },
                { label: "1 Star", value: "1" },
                { label: "2 Stars", value: "2" },
                { label: "3 Stars", value: "3" },
                { label: "4 Stars", value: "4" },
                { label: "5 Stars", value: "5" },
              ]}
              value={{
                label:
                  reviewRating === 0
                    ? "Select rating"
                    : `${reviewRating} Star${reviewRating > 1 ? "s" : ""}`,
                value: reviewRating.toString(),
              }}
              onChange={(option) => setReviewRating(Number(option.value))}
              className="mt-1 block w-full"
              placeholder="Select rating"
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Comment
            </label>
            <textarea
              value={reviewComment}
              onChange={(e) => {
                if (e.target.value.length <= 250)
                  setReviewComment(e.target.value);
              }}
              rows={3}
              className="mt-1 block input w-full border rounded px-2 py-1"
              placeholder="Write your comment..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {reviewComment.length}/250 characters
            </p>
          </div>

          {/* Custom Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Upload Images (optional, max 3)
            </label>

            <div className="mt-1 flex flex-wrap gap-2">
              {/* Image Previews */}
              {reviewImages.map((file, index) => (
                <div
                  key={index}
                  className="relative w-20 h-20 border rounded overflow-hidden"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setReviewImages((prev) =>
                        prev.filter((_, i) => i !== index)
                      )
                    }
                    className="absolute top-1 right-1 bg-hub-secondary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    &times;
                  </button>
                </div>
              ))}

              {/* Upload Placeholder */}
              {reviewImages.length < 3 && (
                <label
                  htmlFor="review-image-upload"
                  className="w-20 h-20 border border-dashed rounded flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-gray-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mb-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 15a4 4 0 104 4H3v-4zM7 9V3m0 0l4 4m-4-4L3 7"
                    />
                  </svg>
                  <span className="text-xs text-center">Add Image</span>
                  <input
                    type="file"
                    id="review-image-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (!e.target.files) return;
                      const files = Array.from(e.target.files).slice(
                        0,
                        3 - reviewImages.length
                      );
                      setReviewImages((prev) => [...prev, ...files]);
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex justify-end gap-3">
            <button
              className="btn btn-gray"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleReviewSubmit}
              disabled={reviewLoading || reviewRating === 0}
            >
              {reviewLoading ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </div>
      </ConfirmationModal>
    </div>
  );
}
