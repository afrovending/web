"use client";

import { useEffect, useState } from "react";
import { FiBell } from "react-icons/fi";
import Skeleton from "react-loading-skeleton";
import { listNotifications } from "@/lib/api/notifications";
import Image from "next/image";
import { NotificationItem } from "@/interfaces/notification";
import { formatHumanReadableDate } from "@/utils/formatDate";

export default function NotificationPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(3);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await listNotifications(offset, limit);

      setNotifications((prev) => [...prev, ...res.data]);
      setTotal(res.total);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [offset]);

  const hasMore = notifications.length < total;

  return (
    <>
      <div className="card mb-6">
        <h2 className="text-lg font-semibold flex items-center">
          <FiBell className="text-green-800 text-xl mr-2" size={24} />
          Notifications
        </h2>
        <p className="text-sm mt-1 text-gray-600">
          From your account dashboard, you can easily get latest updates from
          your orders, products, coupons and other related
          <span className="text-green-800"> notifications </span>.
        </p>
      </div>

      {/* Empty State */}
      {!loading && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-gray-500 animate-fadeIn card">
          <FiBell className="text-green-800 text-xl mr-2" size={24} />
          <h3 className="text-lg font-semibold mb-1">No Notifications</h3>
          <p className="text-sm text-gray-400 text-center max-w-xs">
            You're all caught up! New alerts and updates will appear here.
          </p>
        </div>
      )}

      {/* Items List */}
      <div className="space-y-4">
        {notifications.map((noti: any, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-4 card bg-green-50/50!"
          >
            {noti.image ? (
              <Image
                src={noti.image}
                alt="Notification"
                width={50}
                height={50}
                className="rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-green-100 rounded-lg" />
            )}

            <div className="flex-1">
              <p className="text-gray-800 text-sm">{noti.body}</p>
              <p className="text-xs text-gray-400 mt-1">
                {formatHumanReadableDate(noti.created_at)}
              </p>
            </div>
          </div>
        ))}

        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 card">
              <Skeleton height={20} />
            </div>
          ))}
      </div>

      {/* Load More */}
      {hasMore && !loading && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setOffset(offset + limit)}
            className="btn btn-primary w-full sm:w-1/2"
          >
            Load More
          </button>
        </div>
      )}

      {!hasMore && notifications.length > 0 && (
        <p className="text-center text-gray-400 mt-6">
          You have reached the end.
        </p>
      )}
    </>
  );
}
