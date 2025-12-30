"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { ColumnDef } from "@tanstack/react-table";
import { debounce } from "lodash";
import StatusBadge from "@/utils/StatusBadge";
import {
  EyeIcon,
  StarIcon,
  TrashIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { Product } from "@/interfaces/products";
import { formatHumanReadableDate } from "@/utils/formatDate";

import { deleteItem, listSellerItems, updateItemStatus } from "@/lib/api/items";

import { getStockBadgeClass } from "@/utils/StockBadge";

import ItemForm from "./ItemForm";
import { formatAmount } from "@/utils/formatCurrency";
import ConfirmationModal from "../../components/commons/ConfirmationModal";
import Drawer from "../../components/commons/Drawer";
import SelectDropdown from "../../components/commons/Fields/SelectDropdown";
import TanStackTable from "../../components/commons/TanStackTable";
import { ProductVariation } from "./ProductVariation";

interface ProductTableProps {
  limit: number;
  offset: number;
  status: string;
}
type Option = { label: string; value: string };

const statusOptions: Option[] = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

function ProductActionCell({
  product,
  productId,
  initialStatus,
  onStatusUpdate,
  onEdit,
}: {
  product: any;
  productId: number;
  initialStatus: string;
  onStatusUpdate: (newStatus: string) => void;
  onEdit: (productId: number) => void;
}) {
  const [status, setStatus] = useState<Option>(
    statusOptions.find((opt) => opt.value === initialStatus) || statusOptions[0]
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (selected: Option) => {
    const previous = status;
    setStatus(selected);

    try {
      await updateItemStatus(productId, selected.value);
      toast.success("Status updated");
      onStatusUpdate(selected.value);
    } catch {
      setStatus(previous);
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deleteItem(productId);
      toast.success("Item deleted successfully.");
      setIsModalOpen(false);
      window.location.reload();
    } catch {
      toast.error("Failed to delete item.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Container: 
      - Mobile: Stacked or multi-row (flex-wrap) to prevent layout breaking
      - Desktop: Single horizontal row
    */}
      <div className="flex flex-wrap md:flex-nowrap items-center gap-2 min-w-fit">
        {/* Status Dropdown - Wider on mobile for touch targets */}
        <div className="w-full md:w-32 order-1">
          <SelectDropdown
            value={status}
            options={statusOptions}
            onChange={handleStatusChange}
          />
        </div>

        {/* Variations - Only for Products */}
        {product.type !== "services" && (
          <div className="order-2">
            <ProductVariation product={product} />
          </div>
        )}

        {/* Action Buttons Group */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end md:justify-start order-3">
          {/* Update Button */}
          <button
            className="flex-1 md:flex-none bg-green-800 text-white px-3 py-2 md:p-1.5 rounded-md hover:bg-green-900 flex items-center justify-center gap-1 cursor-pointer transition-colors text-sm font-medium"
            onClick={() => onEdit(productId)}
            title="Update Item"
          >
            <PencilSquareIcon className="w-4 h-4" />
            <span>Update</span>
          </button>

          {/* Delete Button */}
          <button
            className="flex-1 md:flex-none bg-red-500 text-white px-3 py-2 md:p-1.5 rounded-md hover:bg-red-600 flex items-center justify-center gap-1 cursor-pointer transition-colors text-sm font-medium"
            onClick={() => setIsModalOpen(true)}
            title="Delete Item"
          >
            <TrashIcon className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal - Mobile Friendly by default */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirm Deletion"
      >
        <div className="p-1">
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-900">{product.title}</span>
            ? This action cannot be undone and will remove all associated data.
          </p>
          <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3">
            <button
              className="w-full sm:w-auto rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="w-full sm:w-auto rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors cursor-pointer shadow-sm"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Deleting...
                </span>
              ) : (
                "Delete Item"
              )}
            </button>
          </div>
        </div>
      </ConfirmationModal>
    </>
  );
}

const ItemsTable: React.FC<ProductTableProps> = ({ limit, offset, status }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: limit,
  });
  const [totalProducts, setTotalProducts] = useState(0);

  // Drawer and editing product state
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const updateProductStatusInState = (
    id: number,
    newStatus: "active" | "inactive"
  ) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );
  };

  const columns: ColumnDef<Product>[] = useMemo(
    () => [
      {
        header: "Item",
        accessorKey: "title",
        cell: ({ row }) => {
          const image = row.original.images?.[0];
          const title = row.original.title;
          const category = row.original.category?.name;

          return (
            <div className="flex items-center space-x-2 min-w-0">
              <Image
                src={image || "/placeholder.png"}
                alt={title}
                width={40}
                height={40}
                className="w-10 h-10 object-cover rounded shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-gray-800 truncate block max-w-30 sm:max-w-50">
                  {title}
                </span>
                {category && (
                  <span className="text-xs text-gray-500 truncate block max-w-25 sm:max-w-37.5">
                    {category}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        header: "Avg. Rating",
        accessorKey: "average_rating",
        cell: ({ getValue }) => {
          const rating = parseFloat(getValue() as string) || 0;
          const stars = Math.round(rating);

          return (
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, index) => (
                <StarIcon
                  key={index}
                  className={`w-4 h-4 ${
                    index < stars ? "text-green-800" : "text-gray-300"
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {rating.toFixed(1)}
              </span>
            </div>
          );
        },
      },
      {
        header: "Price",
        cell: ({ row }) => {
          const salesPrice = parseFloat(row.original.sales_price || "0");
          const regularPrice = parseFloat(row.original.regular_price || "0");

          const formattedSales = `${formatAmount(salesPrice)}`;
          const formattedRegular = `${formatAmount(regularPrice)}`;

          return (
            <div className="flex flex-col text-xs">
              <span className="text-gray-800 font-semibold">
                {formattedSales}
              </span>
              {salesPrice > 0 &&
                regularPrice > 0 &&
                salesPrice < regularPrice && (
                  <span className="text-gray-500 line-through text-xs">
                    {formattedRegular}
                  </span>
                )}
            </div>
          );
        },
      },
      {
        header: "Stock",
        accessorKey: "quantity",
        cell: ({ row, getValue }) => {
          const isService = row.original.type === "services";
          const quantity = getValue() as number;

          if (isService) {
            return (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                Unlimited • Available
              </span>
            );
          }

          const max = 100;
          const stock = getStockBadgeClass(quantity, max);

          return (
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full ${stock.class}`}
            >
              {quantity} • {stock.level}
            </span>
          );
        },
      },
      {
        header: "Views",
        accessorKey: "views",
        cell: ({ getValue }) => {
          const views = getValue() as number;
          return (
            <div className="flex items-center gap-1 text-gray-700">
              <EyeIcon className="w-4 h-4 text-amber-600" />
              <span>{views}</span>
            </div>
          );
        },
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ getValue }) => {
          const status = String(getValue() || "").toLowerCase();
          return <StatusBadge status={status} />;
        },
      },
      {
        header: "Created At",
        accessorKey: "created_at",
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return formatHumanReadableDate(value);
        },
      },
      {
        header: "Action",
        accessorKey: "id",
        cell: ({ row }) => (
          <ProductActionCell
            product={row.original}
            productId={row.original.id}
            initialStatus={row.original.status}
            onStatusUpdate={(newStatus) =>
              updateProductStatusInState(
                row.original.id,
                newStatus as "active" | "inactive"
              )
            }
            onEdit={(id) => {
              const product = products.find((p) => p.id === id);
              if (product) {
                setEditingProduct(product);
                setDrawerOpen(true);
              }
            }}
          />
        ),
      },
    ],
    [products]
  );

  const fetchProducts = useCallback(
    async (pageIndex: number, search: string = "") => {
      try {
        setLoading(true);
        const offset = pageIndex * pagination.pageSize;
        const response = await listSellerItems(
          pagination.pageSize,
          offset,
          search
        );
        setProducts(response.data);
        setTotalProducts(response.total || 0);
      } catch (err) {
        console.error(err);
        setError("An error occurred while fetching products.");
      } finally {
        setLoading(false);
      }
    },
    [pagination.pageSize]
  );

  const debouncedFetchProducts = useMemo(
    () =>
      debounce((pageIndex: number, search: string) => {
        fetchProducts(pageIndex, search);
      }, 300),
    [fetchProducts]
  );

  useEffect(() => {
    debouncedFetchProducts(pagination.pageIndex, search);
    return () => {
      debouncedFetchProducts.cancel();
    };
  }, [pagination.pageIndex, debouncedFetchProducts, search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  return (
    <div className="space-y-6">
      <div className="mb-4 mt-8">
        <input
          type="text"
          placeholder="Search by item name..."
          value={search}
          onChange={handleSearchChange}
          className="w-full px-3 py-2 border rounded-md border-amber-600 text-gray-900 focus:outline-none"
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
          totalRows: totalProducts,
        }}
        onPaginationChange={(updatedPagination) => {
          setPagination({
            pageIndex: updatedPagination.pageIndex,
            pageSize: updatedPagination.pageSize,
          });
        }}
      />

      {/* Drawer for Add/Edit */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingProduct(null);
        }}
        title={editingProduct ? "Edit Item" : "Add Item"}
      >
        {editingProduct && (
          <ItemForm
            item={editingProduct}
            onClose={() => setDrawerOpen(false)}
          />
        )}
      </Drawer>
    </div>
  );
};

export default ItemsTable;
