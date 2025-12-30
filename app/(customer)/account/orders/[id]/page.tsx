"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Skeleton from "react-loading-skeleton";
import { formatAmount } from "@/utils/formatCurrency";
import { User } from "@/interfaces/user";
import { Order, OrderItem as OrderItemType } from "@/interfaces/orders";
import Address from "@/interfaces/address";
import { getOrderDetail } from "@/lib/api/orders";
import { formatHumanReadableDate } from "@/utils/formatDate";

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

function CustomerSummary({
  customer,
  address,
}: {
  customer: User;
  address: Address;
}) {
  if (!customer || !address) return null;

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 text-sm text-gray-700">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex flex-col gap-2  md:pr-6">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
            Delivery Shipping Address
          </p>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-gray-700 font-medium">
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
              <span className="font-medium">Phone:</span>{" "}
              {address.phone ?? "N/A"}
            </p>
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
          <div className="flex justify-between text-lg font-bold border-t pt-2 border-gray-300 text-red-700">
            <span>Order Total:</span>
            <span>{formatAmount(parseFloat(order.total))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetail() {
  const params = useParams();
  const orderId = params?.id as string | undefined;

  const [orderDetail, setOrderDetail] = useState<Order | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;

      try {
        const response = (await getOrderDetail(orderId)) as OrderDetailResponse;

        setOrderDetail(response.data.order);
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        {/* Left: title */}
        <h1 className="text-lg md:text-xl font-semibold text-gray-800">
          Order Details - #{orderMeta.id}
        </h1>

        {/* Right: buttons — stays on one line on md+ */}
        <div className="flex items-center flex-nowrap space-x-3">
          {/* 1: Buy Again (only when payment completed) */}
          {orderMeta.payment_status === "completed" && (
            <button className="btn btn-primary min-w-[100px] text-xs!">
              Buy Again
            </button>
          )}

          {/* 2 & 3: Cancel / Track (only when shipping ongoing) */}
          {orderMeta.shipping_status === "ongoing" && (
            <>
              <button className="btn btn-gray min-w-[100px] text-xs!">
                Cancel Order
              </button>
              <button className="btn btn-primary min-w-[90px] text-xs!">
                Track Order
              </button>
            </>
          )}
        </div>
      </div>

      <CustomerSummary customer={customer} address={address} />
      <OrderItemsTable order={orderDetail} />

      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
          📦 Shipping & Payment Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
          {/* 1. Shipping Details Group */}
          <div className="space-y-3 pr-4 border-r md:border-r border-gray-200">
            <h4 className="font-bold text-base text-gray-900 mb-2">
              Shipping Info
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
                Tracking Detail:
              </p>
              <p className="text-gray-800 w-1/2 text-right">
                {orderMeta.tracking_url ? (
                  <a
                    href={orderMeta.tracking_url}
                    rel="noopener noreferrer"
                    className="text-red-600 underline truncate block max-w-full"
                    title={orderMeta.tracking_url}
                  >
                    {orderMeta.tracking_url}
                  </a>
                ) : (
                  orderMeta.tracking_number
                )}
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
              Payment Info
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
              <p className="font-medium text-gray-600 w-1/2">Shipping Date:</p>
              <p className={`font-semibold w-1/2 text-right`}>
                {formatHumanReadableDate(orderMeta?.shipping_date || "")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
