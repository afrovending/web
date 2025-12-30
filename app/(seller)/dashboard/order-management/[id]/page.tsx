"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Skeleton from "react-loading-skeleton";
import dayjs from "dayjs";
import { formatAmount } from "@/utils/formatCurrency";
import { User } from "@/interfaces/user";
import { Order, OrderItem as OrderItemType } from "@/interfaces/orders";
import Address from "@/interfaces/address";
import { getOrderDetail } from "@/lib/api/orders";
import { formatHumanReadableDate } from "@/utils/formatDate";
import { STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from "@/setting";
interface OrderStats {
  total_orders: number;
  total_amount: string;
  total_cancelled: number;
  total_delivered: number;
}

// Define the overall API response structure
interface OrderDetailResponse {
  status: string;
  message: string;
  data: {
    order: Order; // Use the corrected Order type
    total_orders: number;
    total_amount: string;
    total_cancelled: number;
    total_delivered: number;
  };
}

// --- OPTIONS (Kept the same) ---

function CustomerSummary({
  customer,
  address,
  stats,
}: {
  customer: User;
  address: Address;
  stats: OrderStats | null;
}) {
  if (!customer || !address) return null;

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 text-sm text-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col gap-4 border-r md:border-r border-gray-100 pr-6">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-full overflow-hidden">
              <Image
                src={customer.profile_photo || "/default-avatar.png"}
                alt={`${customer.name}`}
                height={50}
                width={50}
                className="object-cover"
              />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-base">
                {customer.name} {customer.last_name}
              </p>
              <p className="text-gray-500 text-xs">{customer.email}</p>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              Personal Info
            </p>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Phone:</span>
              <span className="text-gray-600">{customer.phone ?? "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Member Since:</span>
              <span className="text-gray-600">
                {dayjs(customer.created_at).format("DD MMM. YYYY")}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Shipping Address (Middle Column) */}
        <div className="flex flex-col gap-2 border-r md:border-r border-gray-100 pr-6">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
            Default Shipping Address
          </p>
          <div className="bg-gray-50 p-3 rounded-lg h-full">
            <p className="text-gray-700 leading-snug font-medium">
              {customer.name} {customer.last_name}
            </p>
            <p className="text-gray-600">
              {[
                address.street_address,
                address.city,
                address.state,
                address.zip_code,
                address.country,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
            <p className="text-gray-600 mt-1">
              Phone: {address.phone ?? "N/A"}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
            Lifetime Order Summary
          </p>

          <div className="flex flex-col gap-3">
            {/* Row 1: Total Spent (Full Width) */}
            <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg text-center shadow-sm">
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="font-extrabold text-2xl text-green-800 mt-1">
                {formatAmount(parseFloat(stats?.total_amount || "0"))}
              </p>
            </div>

            {/* Row 2: Three items on the same line */}
            <div className="grid grid-cols-3 gap-3">
              {/* Total Orders */}
              <div className="p-3 bg-gray-50 border-l-4 border-gray-300 rounded-lg text-center">
                <p className="text-[10px] md:text-xs text-gray-600 uppercase">
                  Orders
                </p>
                <p className="font-bold text-lg text-gray-800">
                  {stats?.total_orders || 0}
                </p>
              </div>

              {/* Delivered Orders */}
              <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded-lg text-center">
                <p className="text-[10px] md:text-xs text-gray-600 uppercase">
                  Delivered
                </p>
                <p className="font-bold text-lg text-green-700">
                  {stats?.total_delivered || 0}
                </p>
              </div>

              {/* Cancelled Orders */}
              <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-lg text-center">
                <p className="text-[10px] md:text-xs text-gray-600 uppercase">
                  Cancelled
                </p>
                <p className="font-bold text-lg text-red-700">
                  {stats?.total_cancelled || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderItemsTable({ order }: { order: Order }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Order Items ({order.order_items.length})
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead>
            <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-2">Product</th>
              <th className="py-3 px-2">SKU</th>
              <th className="py-3 px-2 text-right">Unit Price</th>
              <th className="py-3 px-2 text-right">Qty</th>
              <th className="py-3 px-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {order.order_items.map((item) => (
              <tr key={item.id}>
                <td className="py-4 px-2">
                  <div className="flex items-center">
                    <Image
                      src={item.product.images[0] || "/placeholder.png"}
                      alt={item.product.title}
                      width={40}
                      height={40}
                      className="w-10 h-10 object-cover rounded mr-3"
                    />
                    <span className="font-medium truncate text-gray-700">
                      {item.product.title}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-2 text-gray-500 truncate">
                  {item.product.sku}
                </td>
                <td className="py-4 px-2 text-right">
                  {formatAmount(parseFloat(item.price))}
                </td>
                <td className="py-4 px-2 text-right">{item.quantity}</td>
                <td className="py-4 px-2 text-right font-semibold">
                  {formatAmount(parseFloat(item.subtotal))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-6">
        <div className="w-full max-w-xs space-y-2 text-gray-700">
          <div className="flex justify-between font-medium">
            <span>Total Items Subtotal:</span>
            <span>
              {formatAmount(
                order.order_items.reduce(
                  (sum, item) => sum + parseFloat(item.subtotal),
                  0
                )
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Shipping Fee ({order.shipping_method}):</span>
            <span>{formatAmount(parseFloat(order.shipping_fee))}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2 border-gray-300 text-green-700">
            <span>Order Total:</span>
            <span>{formatAmount(parseFloat(order.total))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---

export default function OrderDetail() {
  const params = useParams();
  const orderId = params?.id as string | undefined;

  const [orderDetail, setOrderDetail] = useState<Order | null>(null);
  const [stats, setStats] = useState<OrderStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const initialShippingStatus = useMemo(() => {
    const statusValue = orderDetail?.shipping_status || STATUS_OPTIONS[0].value;
    return (
      STATUS_OPTIONS.find((opt) => opt.value === statusValue) ||
      STATUS_OPTIONS[0]
    );
  }, [orderDetail]);

  const initialPaymentStatus = useMemo(() => {
    const statusValue =
      orderDetail?.payment_status || PAYMENT_STATUS_OPTIONS[0].value;
    return (
      PAYMENT_STATUS_OPTIONS.find((opt) => opt.value === statusValue) ||
      PAYMENT_STATUS_OPTIONS[0]
    );
  }, [orderDetail]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;

      try {
        const response = (await getOrderDetail(orderId)) as OrderDetailResponse;

        setOrderDetail(response.data.order);
        setStats({
          total_orders: response.data.total_orders,
          total_amount: response.data.total_amount,
          total_cancelled: response.data.total_cancelled,
          total_delivered: response.data.total_delivered,
        });
      } catch (err) {
        console.error("Failed to load order detail", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading || !orderDetail) {
    if (!loading && !orderDetail)
      return (
        <div className="p-6 text-center text-red-500">Order Not Found.</div>
      );
    return <Skeleton count={10} className="p-4" />;
  }

  const orderMeta = orderDetail;
  const customer = orderDetail.customer;
  const address = orderDetail.address;

  return (
    <div className="p-0 text-gray-600 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">
          Order Details - #{orderMeta.id}
        </h1>
        <div className="flex items-center gap-2">
          {orderMeta.shipping_status === "processing" &&
            orderMeta.payment_status === "pending" && (
              <button className="bg-red-100 text-red-600 px-4 py-1 rounded-md text-sm font-medium">
                Eligible for refund
              </button>
            )}
        </div>
      </div>
      <CustomerSummary customer={customer} address={address} stats={stats} />
      <OrderItemsTable order={orderDetail} />

      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
          📦 Shipping & Payment Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
          {/* 1. Shipping Details Group */}
          <div className="space-y-3 pr-4 border-r md:border-r border-gray-200">
            <h4 className="font-bold text-base text-gray-900 mb-2">
              Shipping Information
            </h4>

            <div className="flex justify-between items-start">
              <p className="font-medium text-gray-600 w-1/2">
                Shipping Method:
              </p>
              {/* Assuming shipping_method is available on orderMeta */}
              <p className="text-gray-800 font-semibold w-1/2 text-right">
                {orderMeta.shipping_method ?? "N/A"}
              </p>
            </div>

            <div className="flex justify-between items-start">
              <p className="font-medium text-gray-600 w-1/2">
                Tracking Number:
              </p>
              <p className="text-gray-800 w-1/2 text-right">
                {orderMeta.tracking_number ?? "N/A"}
              </p>
            </div>

            <div className="flex justify-between items-start">
              <p className="font-medium text-gray-600 w-1/2">
                Estimated Delivery:
              </p>
              <p className="text-gray-800 w-1/2 text-right">
                {orderMeta.delivery_date
                  ? formatHumanReadableDate(orderMeta.delivery_date)
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* 2. Payment & Settlement Group */}
          <div className="space-y-3 pl-4">
            <h4 className="font-bold text-base text-gray-900 mb-2">
              Payment & Vendor Info
            </h4>

            <div className="flex justify-between items-start">
              <p className="font-medium text-gray-600 w-1/2">Payment Method:</p>
              <p className="text-gray-800 w-1/2 text-right">
                {orderMeta.payment_method.toUpperCase()}
              </p>
            </div>

            <div className="flex justify-between items-start">
              <p className="font-medium text-gray-600 w-1/2">Payment Status:</p>
              {/* Using the payment_status from the Order object for accuracy */}
              <p
                className={`font-semibold w-1/2 text-right ${
                  orderMeta.payment_status === "completed"
                    ? "text-green-700"
                    : "text-red-700"
                }`}
              >
                {orderMeta.payment_status.toUpperCase()}
              </p>
            </div>

            <div className="flex justify-between items-start">
              <p className="font-medium text-gray-600 w-1/2">
                Vendor Settlement:
              </p>
              <p
                className={`font-semibold w-1/2 text-right ${
                  orderMeta.vendor_payment_settlement_status === "unpaid"
                    ? "text-red-700"
                    : "text-green-700"
                }`}
              >
                {orderMeta.vendor_payment_settlement_status.toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
