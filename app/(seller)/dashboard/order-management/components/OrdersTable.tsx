"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { ColumnDef } from "@tanstack/react-table";
import { debounce } from "lodash";
import StatusBadge from "@/utils/StatusBadge";
import { formatHumanReadableDate } from "@/utils/formatDate";
import { listVendorOrders } from "@/lib/api/orders";
import TanStackTable from "@/app/(seller)/dashboard/components/commons/TanStackTable";
import { Order, OrderListResponse } from "@/interfaces/orders";

interface OrderTableProps {
  limit: number;
  status?: string;
}

const OrderTable: React.FC<OrderTableProps> = ({ limit, status }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: limit,
  });
  const [totalOrders, setTotalOrders] = useState(0);

  const columns: ColumnDef<Order>[] = useMemo(
    () => [
      {
        header: "Customer",
        accessorKey: "customer.name",
        cell: ({ row }) => {
          const customer = row.original.customer;
          return (
            <div className="flex items-center space-x-2">
              <Image
                width={50}
                height={50}
                src={customer?.profile_photo || "/default-avatar.png"}
                alt={customer?.name || "User"}
                className="w-10 h-10 object-cover rounded-full"
              />
              <span>{customer?.name ?? "N/A"}</span>
            </div>
          );
        },
      },
      {
        header: "Item",
        accessorKey: "order_items",
        cell: ({ row }) => {
          const item = row.original.order_items[0]?.product;
          const imageSrc = item?.images?.[0] || "";

          return (
            <div className="flex items-center space-x-2">
              <Image
                src={imageSrc}
                alt={item?.title || "Product"}
                width={40}
                height={40}
                className="w-10 h-10 object-cover rounded"
              />
              <span>{item?.title ?? "N/A"}</span>
            </div>
          );
        },
      },
      {
        header: "Subtotal",
        accessorKey: "order_items",
        cell: ({ row }) => {
          const subtotal = row.original.order_items[0]?.subtotal;
          const numericValue = parseFloat(subtotal || "0");

          return isNaN(numericValue)
            ? "Invalid"
            : `$${numericValue.toFixed(2)}`;
        },
      },
      {
        header: "Quantity",
        accessorKey: "order_items",
        cell: ({ row }) => {
          const quantity = row.original.order_items[0]?.quantity;
          return quantity ?? 0;
        },
      },
      {
        header: "Shipping",
        accessorKey: "shipping_status",
        cell: ({ getValue }) => {
          const value = String(getValue() ?? "N/A");
          return <StatusBadge status={value} />;
        },
      },
      {
        header: "Payment",
        accessorKey: "payment_status",
        cell: ({ getValue }) => {
          const value = String(getValue() ?? "N/A");
          return <StatusBadge status={value} type={"payment"} />;
        },
      },
      {
        header: "Action",
        accessorKey: "id",
        cell: ({ getValue }) => {
          const orderId = getValue() as number;
          return (
            <button
              className="px-3 py-1 bg-hub-primary text-white rounded hover:bg-hub-secondary cursor-pointer"
              onClick={() => {
                window.location.href = `/dashboard/order-management/${orderId}`;
              }}
            >
              View Order
            </button>
          );
        },
      },
      {
        header: "Date",
        accessorKey: "created_at",
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return formatHumanReadableDate(value);
        },
      },
    ],
    []
  );

  const fetchOrders = useCallback(
    async (pageIndex: number, search: string) => {
      try {
        setLoading(true);
        const offset = pageIndex * pagination.pageSize;
        const response = (await listVendorOrders(
          pagination.pageSize,
          offset,
          search,
          status
        )) as OrderListResponse;

        if (response.status === "success" && Array.isArray(response.data)) {
          setOrders(response.data);
          setTotalOrders(response.total || 0);
        } else {
          setOrders([]);
          setError("Received invalid data structure from API.");
        }
      } catch (err) {
        console.error(err);
        setError("An error occurred while fetching orders.");
      } finally {
        setLoading(false);
      }
    },
    [pagination.pageSize, status]
  );

  const debouncedFetchOrders = useMemo(
    () =>
      debounce((pageIndex: number, search: string) => {
        fetchOrders(pageIndex, search);
      }, 300),
    [fetchOrders]
  );

  useEffect(() => {
    debouncedFetchOrders(pagination.pageIndex, search);
    return () => {
      debouncedFetchOrders.cancel();
    };
  }, [pagination.pageIndex, debouncedFetchOrders, search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by customer or product name..."
          value={search}
          onChange={handleSearchChange}
          className="w-full px-3 py-2 border rounded-md border-amber-600 text-gray-900 focus:outline-hub-primary-400"
        />
      </div>
      <TanStackTable
        data={orders}
        columns={columns}
        loading={loading}
        error={error}
        pagination={{
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          totalRows: totalOrders,
        }}
        onPaginationChange={(updatedPagination) => {
          setPagination({
            pageIndex: updatedPagination.pageIndex,
            pageSize: updatedPagination.pageSize,
          });
        }}
      />
    </div>
  );
};

export default OrderTable;
