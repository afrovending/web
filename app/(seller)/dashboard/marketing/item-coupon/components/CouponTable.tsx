"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { ColumnDef } from "@tanstack/react-table";
import { debounce } from "lodash";
import StatusBadge from "@/utils/StatusBadge";
import { formatHumanReadableDate } from "@/utils/formatDate";
import TanStackTable from "@/app/(seller)/dashboard/components/commons/TanStackTable";
import { listCoupons } from "@/lib/api/seller/coupons";

interface Discount {
  id: number;
  discount_code: string;
  discount_rate: number;
  discount_type: "percentage" | "fixed";
  start_time: string;
  end_time: string;
  status: string;
  product?: {
    title: string;
    images: string[];
  };
}

interface CouponTableProps {
  limit: number;
  onEdit: (coupon: Discount) => void; // Add this line
}

const CouponTable: React.FC<CouponTableProps> = ({ limit, onEdit }) => {
  const [coupons, setCoupons] = useState<Discount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: limit,
  });
  const [totalCoupons, setTotalCoupons] = useState(0);

  const columns: ColumnDef<Discount>[] = useMemo(
    () => [
      {
        header: "Discount Code",
        accessorKey: "discount_code",
        cell: ({ row }) => (
          <span className="font-bold text-hub-primary uppercase tracking-wider">
            {row.original.discount_code}
          </span>
        ),
      },
      {
        header: "Associated Product",
        accessorKey: "product",
        cell: ({ row }) => {
          const product = row.original.product;
          if (!product)
            return <span className="text-gray-400">Store-wide</span>;
          return (
            <div className="flex items-center space-x-2">
              <Image
                src={product.images?.[0] || "/placeholder.png"}
                alt={product.title}
                width={40}
                height={40}
                className="w-8 h-8 object-cover rounded"
              />
              <span className="truncate max-w-37.5">{product.title}</span>
            </div>
          );
        },
      },
      {
        header: "Value",
        accessorKey: "discount_rate",
        cell: ({ row }) => {
          const { discount_rate, discount_type } = row.original;
          return (
            <span className="font-medium text-gray-900">
              {discount_type === "percentage"
                ? `${discount_rate}%`
                : `$${discount_rate}`}
            </span>
          );
        },
      },
      {
        header: "Valid From",
        accessorKey: "start_time",
        cell: ({ getValue }) => formatHumanReadableDate(getValue() as string),
      },
      {
        header: "Expiry Date",
        accessorKey: "end_time",
        cell: ({ getValue }) => formatHumanReadableDate(getValue() as string),
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ getValue }) => {
          const value = String(getValue() ?? "inactive");
          return <StatusBadge status={value} />;
        },
      },
      // Inside CouponTable columns definition
      {
        header: "Action",
        accessorKey: "id",
        cell: ({ row }) => (
          <button
            className="text-green-800 font-semibold hover:underline cursor-pointer"
            onClick={() => onEdit(row.original)} // Trigger Parent's drawer
          >
            Edit
          </button>
        ),
      },
    ],
    []
  );

  const fetchCoupons = useCallback(
    async (pageIndex: number, search: string) => {
      try {
        setLoading(true);
        const offset = pageIndex * pagination.pageSize;
        const response = await listCoupons(pagination.pageSize, offset, search);

        if (response.status === "success" && Array.isArray(response.data)) {
          setCoupons(response.data);
          setTotalCoupons(response.total || response.data.length);
        } else {
          setCoupons([]);
          setError("Failed to retrieve coupons.");
        }
      } catch (err) {
        console.error(err);
        setError("An error occurred while fetching coupons.");
      } finally {
        setLoading(false);
      }
    },
    [pagination.pageSize]
  );

  const debouncedFetch = useMemo(
    () =>
      debounce((pageIndex: number, search: string) => {
        fetchCoupons(pageIndex, search);
      }, 300),
    [fetchCoupons]
  );

  useEffect(() => {
    debouncedFetch(pagination.pageIndex, search);
    return () => debouncedFetch.cancel();
  }, [pagination.pageIndex, debouncedFetch, search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  return (
    <div>
      <div className="mb-4 flex justify-between items-center gap-4">
        <input
          type="text"
          placeholder="Search by coupon code..."
          value={search}
          onChange={handleSearchChange}
          className="w-full max-w-md px-3 py-2 border rounded-md border-amber-600 text-gray-900 focus:outline-hub-primary-400"
        />
      </div>

      <TanStackTable
        data={coupons}
        columns={columns}
        loading={loading}
        error={error}
        pagination={{
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          totalRows: totalCoupons,
        }}
        onPaginationChange={(updated) => {
          setPagination({
            pageIndex: updated.pageIndex,
            pageSize: updated.pageSize,
          });
        }}
      />
    </div>
  );
};

export default CouponTable;
