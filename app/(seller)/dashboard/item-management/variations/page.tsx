"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { ColumnDef } from "@tanstack/react-table";
import { debounce } from "lodash";
import { TrashIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { Product } from "@/interfaces/products";
import { deleteItem, listSellerVariationItems } from "@/lib/api/items";
import ConfirmationModal from "../../components/commons/ConfirmationModal";
import TanStackTable from "../../components/commons/TanStackTable";

interface ProductTableProps {
  limit: number;
  offset: number;
}

function VariationActionCell({
  product,
  onDeleteSuccess,
}: {
  product: any;
  onDeleteSuccess: () => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deleteItem(product.id);
      toast.success("Item deleted successfully.");
      setIsModalOpen(false);
      onDeleteSuccess();
    } catch {
      toast.error("Failed to delete item.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 flex items-center gap-1 cursor-pointer transition-colors text-sm font-medium"
        onClick={() => setIsModalOpen(true)}
      >
        <TrashIcon className="w-4 h-4" />
        <span>Delete</span>
      </button>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirm Deletion"
      >
        <div className="p-1">
          <p className="mt-2 text-sm text-gray-500">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-900">{product.title}</span>
            ?
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              className="px-4 py-2 text-sm font-semibold text-gray-700 border rounded-xl hover:bg-gray-50 cursor-pointer"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 cursor-pointer"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete Item"}
            </button>
          </div>
        </div>
      </ConfirmationModal>
    </>
  );
}

const ItemsVariationsTable: React.FC<ProductTableProps> = ({
  limit,
  offset,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [totalProducts, setTotalProducts] = useState(0);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: limit || 10,
  });

  const columns: ColumnDef<Product>[] = useMemo(
    () => [
      {
        header: "Product",
        accessorKey: "title",
        cell: ({ row }) => {
          const imgUrl = Array.isArray(row.original.images)
            ? row.original.images[0]
            : "/placeholder.png";
          return (
            <div className="flex items-center space-x-3">
              <div className="relative w-10 h-10 shrink-0">
                <Image
                  src={imgUrl || "/placeholder.png"}
                  alt={row.original.title}
                  fill
                  className="object-cover rounded"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-gray-800 truncate max-w-50">
                  {row.original.title}
                </span>
                <span className="text-xs text-gray-500 uppercase">
                  {row.original.sku}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        header: "Variations & Attributes",
        accessorKey: "variations",
        cell: ({ row }) => {
          const vars = row.original.variations || [];
          return (
            <div className="flex flex-wrap gap-1.5">
              {vars.map((v: any) => (
                <div
                  key={v.id}
                  className="inline-flex items-center px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-100 rounded text-[10px] font-bold whitespace-nowrap"
                >
                  <span className="uppercase">{v.size?.name || "N/A"}</span>
                  {v.color?.name && (
                    <>
                      <span className="mx-1 opacity-40">|</span>
                      <span className="font-medium">{v.color.name}</span>
                    </>
                  )}
                </div>
              ))}
              {vars.length === 0 && (
                <span className="text-gray-400 text-xs italic">
                  No variations linked
                </span>
              )}
            </div>
          );
        },
      },
      {
        header: "Action",
        cell: ({ row }) => (
          <VariationActionCell
            product={row.original}
            onDeleteSuccess={() => fetchProducts(pagination.pageIndex, search)}
          />
        ),
      },
    ],
    [pagination.pageIndex, search]
  );

  const fetchProducts = useCallback(
    async (pageIndex: number, searchTerm: string = "") => {
      try {
        setLoading(true);
        const currentOffset = pageIndex * pagination.pageSize;
        const response = await listSellerVariationItems(
          pagination.pageSize,
          currentOffset,
          searchTerm
        );
        setProducts(response.data || []);
        setTotalProducts(Number(response.total) || 0);
      } catch (err) {
        setError("Unable to load product variations. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [pagination.pageSize]
  );

  const debouncedFetch = useMemo(
    () => debounce((idx, q) => fetchProducts(idx, q), 400),
    [fetchProducts]
  );

  useEffect(() => {
    debouncedFetch(pagination.pageIndex, search);
    return () => debouncedFetch.cancel();
  }, [pagination.pageIndex, search, debouncedFetch]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Filter by product name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
          className="w-full input"
        />
      </div> 

      <TanStackTable
        data={products}
        columns={columns}
        loading={loading}
        error={error}
        pagination={{
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          totalRows: totalProducts || 0,
        }}
        onPaginationChange={(updated) => setPagination(updated)}
      />
    </div>
  );
};

export default ItemsVariationsTable;
